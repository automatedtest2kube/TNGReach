import { DetectDocumentTextCommand, TextractClient, type Block } from "@aws-sdk/client-textract";
import sharp from "sharp";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

let client: TextractClient | null = null;
function getClient() {
  if (!client) {
    client = new TextractClient(getAwsClientConfig());
  }
  return client;
}

const MAX_BYTES = 10 * 1024 * 1024;

// ── Textract helpers ───────────────────────────────────────────────────────

interface RawLine {
  text: string;
  confidence: number;
}

async function imageBytesFromRef(inputRef: string): Promise<Uint8Array> {
  if (inputRef.startsWith("data:") && inputRef.includes("base64,")) {
    const b64 = inputRef.split("base64,")[1];
    if (!b64) throw new HttpError(400, "Invalid data: URL", "invalid_image_data_url");
    return Buffer.from(b64, "base64");
  }
  if (inputRef.startsWith("http://") || inputRef.startsWith("https://")) {
    const res = await fetch(inputRef);
    if (!res.ok)
      throw new HttpError(400, `Could not download image: ${res.status}`, "image_fetch_failed");
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_BYTES)
      throw new HttpError(400, "Image exceeds 10 MB Textract limit", "image_too_large");
    return buf;
  }
  throw new HttpError(
    400,
    "inputRef must be a https URL or a base64 data: URL",
    "invalid_input_ref",
  );
}

/** Call Textract and return raw lines with confidence, sorted top-to-bottom */
async function callTextract(bytes: Uint8Array): Promise<RawLine[]> {
  const out = await getClient().send(new DetectDocumentTextCommand({ Document: { Bytes: bytes } }));
  const lines = (out.Blocks ?? [])
    .filter((b: Block) => b.BlockType === "LINE" && b.Text)
    .sort((a: Block, b: Block) => {
      const ay = a.Geometry?.BoundingBox?.Top ?? 0;
      const by = b.Geometry?.BoundingBox?.Top ?? 0;
      return ay - by;
    })
    .map((b: Block) => ({
      text: (b.Text as string).trim(),
      confidence: b.Confidence ?? 0,
      top: b.Geometry?.BoundingBox?.Top ?? 0,
      left: b.Geometry?.BoundingBox?.Left ?? 0,
    }))
    .filter((l) => l.text.length > 0);

  // Debug: log every raw line Textract returns so we can verify parsing inputs
  console.log("[textract] raw lines from OCR:");
  lines.forEach((l, i) =>
    console.log(
      `  [${i}] top=${l.top.toFixed(3)} left=${l.left.toFixed(3)} conf=${l.confidence.toFixed(1)} | "${l.text}"`,
    ),
  );

  return lines.map(({ text, confidence }) => ({ text, confidence }));
}

// ── Image pre-processing ───────────────────────────────────────────────────

/**
 * Enhance the full card image before sending to Textract:
 * greyscale → normalise → sharpen → 1.5× upscale → lossless PNG.
 * Removes the light-blue MyKad tint and boosts contrast on dark text.
 */
async function enhanceCard(inputBuf: Buffer): Promise<Buffer> {
  const meta = await sharp(inputBuf).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  return sharp(inputBuf)
    .greyscale()
    .normalise()
    .sharpen({ sigma: 1.2 })
    .resize(Math.round(w * 1.5), Math.round(h * 1.5), { kernel: "lanczos3" })
    .png()
    .toBuffer();
}

// ── MyKad parser adapter ───────────────────────────────────────────────────

const BLACKLIST = [
  "KAD PENGENALAN",
  "MALAYSIA",
  "MYKAD",
  "MYKAQ", // Textract misread of MyKad watermark
  "MYkad",
  "WARGANEGARA",
  "NATIONALITY",
  "LELAKI",
  "PEREMPUAN",
  "ISLAM",
  "BUDDHA",
  "HINDU",
  "KRISTIAN",
  "LAIN-LAIN",
  "TARIKH LAHIR",
  "DATE OF BIRTH",
  "JANTINA",
  "GENDER",
  "KHUNSA",
];

const STATE_WORDS = [
  "JOHOR",
  "KEDAH",
  "KELANTAN",
  "MELAKA",
  "NEGERI SEMBILAN",
  "PAHANG",
  "PERAK",
  "PERLIS",
  "PULAU PINANG",
  "PENANG",
  "SABAH",
  "SARAWAK",
  "SELANGOR",
  "TERENGGANU",
  "KUALA LUMPUR",
  "PUTRAJAYA",
  "LABUAN",
  "W.P.",
];

const STREET_KEYWORDS =
  /\b(JALAN|JLN|LORONG|LRG|TAMAN|TMN|KAMPUNG|KG|BANDAR|PERSIARAN|NO|LOT|FELDA|BLOK|BLOCK|TINGKAT|FLAT|APARTMENT|APT|RESIDENSI|DESA|PANDAN|WANGSA|BUKIT|SRI|SERI)\b/;

const IC_REGEX = /\b(\d{6}[-\s]?\d{2}[-\s]?\d{4})\b/;

export interface IcExtractResult {
  icNumber: string | null;
  fullName: string | null;
  address: string | null;
  confidence: {
    icNumber: number;
    fullName: number;
    address: number;
  };
  needsReview: boolean;
  rawLines: string[];
}

/**
 * Content-based MyKad parser — does NOT rely on line order.
 *
 * Strategy:
 *  - IC number : first line matching YYMMDD-SS-NNNN pattern
 *  - Full name : all-alpha lines (≥5 chars), not blacklisted, not IC, pick highest-confidence
 *  - Address   : lines containing digits, state names, or street keywords, excluding IC line
 */
export function parseMyKadLines(lines: RawLine[]): IcExtractResult {
  const rawLineTexts = lines.map((l) => l.text);

  // Filter out blacklisted lines
  const clean = lines.filter((l) => {
    const upper = l.text.toUpperCase();
    // Catch all MyKad watermark misreads: MYKAD, MYKAQ, MYKAL, etc.
    if (/^MYK[A-Z]{2}$/.test(upper)) return false;
    return !BLACKLIST.some((word) => upper.includes(word.toUpperCase()));
  });

  // ── IC Number ──────────────────────────────────────────────────────────────
  let icNumber: string | null = null;
  let icConfidence = 0;
  let icLineText: string | null = null;

  for (const line of lines) {
    const m = line.text.match(IC_REGEX);
    if (m) {
      icNumber = m[1].replace(/[-\s]/g, "");
      icConfidence = line.confidence / 100;
      icLineText = line.text;
      break;
    }
  }

  // ── Full Name ──────────────────────────────────────────────────────────────
  // A line that looks like part of an address even if it has no digits
  const isAddressLike = (upper: string) =>
    STREET_KEYWORDS.test(upper) ||
    STATE_WORDS.some((s) => upper.includes(s)) ||
    /^\d{5}(\s|$)/.test(upper); // postcode

  // All-alpha lines, min 5 chars, not IC, not blacklisted, not address-like
  const nameCandidates = clean.filter((l) => {
    const upper = l.text.toUpperCase();
    return (
      /^[A-Z\s@'/.-]+$/.test(upper) &&
      upper.length >= 5 &&
      !IC_REGEX.test(upper) &&
      !/\d/.test(upper) &&
      !isAddressLike(upper)
    );
  });

  let fullName: string | null = null;
  let nameConfidence = 0;

  if (nameCandidates.length > 0) {
    // Sort by original document order
    const ordered = nameCandidates.slice().sort((a, b) => lines.indexOf(a) - lines.indexOf(b));

    // Collect consecutive name lines; stop if a non-name line falls between them
    const nameGroup: RawLine[] = [ordered[0]];
    for (let i = 1; i < ordered.length; i++) {
      const prevIdx = lines.indexOf(ordered[i - 1]);
      const currIdx = lines.indexOf(ordered[i]);
      if (currIdx - prevIdx <= 2) {
        nameGroup.push(ordered[i]);
      } else {
        break;
      }
    }

    fullName = nameGroup
      .map((l) => l.text.toUpperCase())
      .join(" ")
      .trim();
    nameConfidence = nameGroup.reduce((sum, l) => sum + l.confidence, 0) / nameGroup.length / 100;
  }

  // ── Address ────────────────────────────────────────────────────────────────
  // Lines with digits, state words, or street keywords — excluding the IC line
  const addrLines = clean.filter((l) => {
    const upper = l.text.toUpperCase();
    if (icLineText && l.text === icLineText) return false;
    return (
      /\d/.test(upper) || STATE_WORDS.some((s) => upper.includes(s)) || STREET_KEYWORDS.test(upper)
    );
  });

  const address = addrLines.length ? addrLines.map((l) => l.text.toUpperCase()).join(", ") : null;
  const addrConfidence = addrLines.length
    ? addrLines.reduce((sum, l) => sum + l.confidence, 0) / addrLines.length / 100
    : 0;

  const needsReview = !fullName || !icNumber || !address;

  console.log("[textract] parse result:", { icNumber, fullName, address, needsReview });

  return {
    icNumber,
    fullName,
    address,
    confidence: {
      icNumber: icConfidence,
      fullName: nameConfidence,
      address: addrConfidence,
    },
    needsReview,
    rawLines: rawLineTexts,
  };
}

export async function extractIcFields(imageRef: string): Promise<IcExtractResult> {
  const isDataUrl = imageRef.startsWith("data:") && imageRef.includes("base64,");

  let bytes: Uint8Array;

  if (isDataUrl) {
    // Enhance the card image before OCR — greyscale + normalise removes the
    // light-blue tint and boosts dark text contrast significantly
    try {
      const b64 = imageRef.split("base64,")[1]!;
      const inputBuf = Buffer.from(b64, "base64");
      bytes = await enhanceCard(inputBuf);
    } catch {
      bytes = await imageBytesFromRef(imageRef);
    }
  } else {
    bytes = await imageBytesFromRef(imageRef);
  }

  const lines = await callTextract(bytes);
  return parseMyKadLines(lines);
}

export interface DebugScanResult {
  rawLines: Array<{ text: string; confidence: number; top: number; left: number }>;
  parsed: IcExtractResult;
  enhanced: boolean;
}

/**
 * Debug helper — returns raw Textract lines with geometry AND the parsed result.
 * Exposes exactly what OCR sees before and after parsing so mismatches are obvious.
 */
export async function debugScanRaw(imageRef: string): Promise<DebugScanResult> {
  const isDataUrl = imageRef.startsWith("data:") && imageRef.includes("base64,");
  let bytes: Uint8Array;
  let enhanced = false;

  if (isDataUrl) {
    try {
      const b64 = imageRef.split("base64,")[1]!;
      const inputBuf = Buffer.from(b64, "base64");
      bytes = await enhanceCard(inputBuf);
      enhanced = true;
    } catch {
      bytes = await imageBytesFromRef(imageRef);
    }
  } else {
    bytes = await imageBytesFromRef(imageRef);
  }

  // Call Textract directly and keep geometry for the debug response
  const out = await getClient().send(new DetectDocumentTextCommand({ Document: { Bytes: bytes } }));
  const rawLines = (out.Blocks ?? [])
    .filter((b: Block) => b.BlockType === "LINE" && b.Text)
    .sort((a: Block, b: Block) => {
      const ay = a.Geometry?.BoundingBox?.Top ?? 0;
      const by = b.Geometry?.BoundingBox?.Top ?? 0;
      return ay - by;
    })
    .map((b: Block) => ({
      text: (b.Text as string).trim(),
      confidence: b.Confidence ?? 0,
      top: b.Geometry?.BoundingBox?.Top ?? 0,
      left: b.Geometry?.BoundingBox?.Left ?? 0,
    }))
    .filter((l) => l.text.length > 0);

  const parsed = parseMyKadLines(rawLines.map(({ text, confidence }) => ({ text, confidence })));

  return { rawLines, parsed, enhanced };
}

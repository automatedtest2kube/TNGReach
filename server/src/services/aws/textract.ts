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

const MAX_BYTES = 10 * 1024 * 1024; // Textract 10 MB limit for inline bytes

// ── Region crop helpers ────────────────────────────────────────────────────

interface CropRegion {
  x: number; // fraction of image width  (0–1)
  y: number; // fraction of image height (0–1)
  width: number; // fraction of image width
  height: number; // fraction of image height
}

/**
 * MyKad region map — derived from the actual card layout:
 *
 *  ┌─────────────────────────────────────────────┐
 *  │  KAD PENGENALAN MALAYSIA        [flag/logo]  │  0–18%
 *  │  550106-12-5821                              │  18–30%
 *  │  [chip]                  [photo]             │  30–55%
 *  │  ROWAN SEBASTIAN ATKINSON        [photo]     │  55–70%
 *  │  GDW KAMPUNG BAYANGAN            [photo]     │  70–78%
 *  │  80000 KENINGAU                  WARGANEGARA │  78–86%
 *  │  SABAH                           KHUNSA  H   │  86–95%
 *  └─────────────────────────────────────────────┘
 *
 *  Left text column occupies x: 0–58% (photo is right 42%)
 */
const IC_REGIONS = {
  // IC number sits just below the header band
  icNumber: { x: 0.02, y: 0.18, width: 0.56, height: 0.14 },
  // Name block: below the chip, left column only
  fullName: { x: 0.02, y: 0.54, width: 0.56, height: 0.18 },
  // Address block: three lines below the name
  address: { x: 0.02, y: 0.68, width: 0.56, height: 0.28 },
} as const;

/**
 * Crop + pre-process a region for Textract.
 * Steps:
 *   1. Extract the fractional region
 *   2. Convert to greyscale (removes the light-blue tint that confuses OCR)
 *   3. Normalise levels (auto-contrast)
 *   4. Sharpen slightly
 *   5. Scale up 2× so small text is easier to read
 *   6. Output as high-quality PNG (lossless — avoids JPEG artefacts on text)
 */
async function cropAndEnhance(inputBuf: Buffer, region: CropRegion): Promise<Buffer> {
  const meta = await sharp(inputBuf).metadata();
  const iw = meta.width ?? 0;
  const ih = meta.height ?? 0;

  const left = Math.max(0, Math.round(region.x * iw));
  const top = Math.max(0, Math.round(region.y * ih));
  const width = Math.min(iw - left, Math.round(region.width * iw));
  const height = Math.min(ih - top, Math.round(region.height * ih));

  return sharp(inputBuf)
    .extract({ left, top, width, height })
    .greyscale()
    .normalise()
    .sharpen({ sigma: 1.2 })
    .resize(width * 2, height * 2, { kernel: "lanczos3" })
    .png()
    .toBuffer();
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

/** Send raw bytes to Textract and return LINE-level text blocks sorted top-to-bottom */
async function extractLinesFromBytes(bytes: Uint8Array): Promise<string[]> {
  const out = await getClient().send(new DetectDocumentTextCommand({ Document: { Bytes: bytes } }));
  return (out.Blocks ?? [])
    .filter((b: Block) => b.BlockType === "LINE" && b.Text)
    .sort((a: Block, b: Block) => {
      // Sort by vertical position so multi-line fields stay in order
      const ay = a.Geometry?.BoundingBox?.Top ?? 0;
      const by = b.Geometry?.BoundingBox?.Top ?? 0;
      return ay - by;
    })
    .map((b: Block) => b.Text as string);
}

async function extractLines(imageRef: string): Promise<string[]> {
  const bytes = await imageBytesFromRef(imageRef);
  return extractLinesFromBytes(bytes);
}

export interface IcExtractResult {
  icNumber: string | null;
  fullName: string | null;
  address: string | null;
  rawLines: string[];
}

/** Words that are never part of a name or address on a Malaysian MyKad */
const NOISE =
  /^(KAD\s*PENGENALAN|MALAYSIA|MYKAD|WARGANEGARA|NATIONALITY|TARIKH|DATE\s*LAHIR|JANTINA|GENDER|KHUNSA|H|L|P|LELAKI|PEREMPUAN|ISLAM|BUDDHA|HINDU|KRISTIAN|LAIN-LAIN)$/i;

/** A postcode line: 5 digits optionally followed by a town/state name */
const POSTCODE = /^\d{5}(\s+.+)?$/;

/** IC number: YYMMDD-SS-NNNN with or without dashes */
const IC_REGEX = /\b(\d{6}[-\s]?\d{2}[-\s]?\d{4})\b/;

/**
 * Parse Malaysian MyKad fields from Textract lines.
 *
 * MyKad line order (no section labels):
 *   KAD PENGENALAN / MALAYSIA / MyKad   ← noise
 *   <IC number>                          ← YYMMDD-SS-NNNN
 *   <name line 1>                        ← e.g. ROWAN SEBASTIAN
 *   <name line 2 if long name>           ← e.g. ATKINSON  (joined with space)
 *   <address line(s)>                    ← street / kampung
 *   <postcode + town>                    ← e.g. 80000 KENINGAU
 *   <state>                              ← e.g. SABAH
 *   WARGANEGARA / KHUNSA / H …          ← noise
 */
export function parseMyKadLines(lines: string[]): IcExtractResult {
  const clean = lines.map((l) => l.trim()).filter((l) => l && !NOISE.test(l));

  // ── IC Number ──────────────────────────────────────────────────────────────
  let icNumber: string | null = null;
  let icIdx = -1;
  for (let i = 0; i < clean.length; i++) {
    const m = clean[i].match(IC_REGEX);
    if (m) {
      icNumber = m[1].replace(/[-\s]/g, "");
      icIdx = i;
      break;
    }
  }

  if (icIdx === -1) return { icNumber: null, fullName: null, address: null, rawLines: lines };

  // ── Full Name ──────────────────────────────────────────────────────────────
  const nameLines: string[] = [];
  let cursor = icIdx + 1;
  while (cursor < clean.length) {
    const l = clean[cursor];
    if (POSTCODE.test(l)) break;
    if (/\d/.test(l)) break;
    if (NOISE.test(l)) break;
    if (/^[A-Z][A-Z\s'/.-]+$/.test(l) && l.length > 1) {
      nameLines.push(l);
      cursor++;
    } else {
      break;
    }
  }
  const fullName = nameLines.length ? nameLines.join(" ") : null;

  // ── Address ────────────────────────────────────────────────────────────────
  const addrLines: string[] = [];
  while (cursor < clean.length && addrLines.length < 5) {
    const l = clean[cursor];
    if (NOISE.test(l)) break;
    addrLines.push(l);
    cursor++;
  }
  const address = addrLines.length ? addrLines.join(", ") : null;

  return { icNumber, fullName, address, rawLines: lines };
}

/**
 * Parse name lines from a cropped name-only region.
 * The region contains no IC number, so we just collect all valid name lines.
 */
function parseCroppedName(lines: string[]): string | null {
  const parts = lines
    .map((l) => l.trim())
    .filter((l) => l && !NOISE.test(l) && !/\d/.test(l) && /^[A-Z][A-Z\s'/.-]+$/.test(l));
  return parts.length ? parts.join(" ") : null;
}

/**
 * Parse address lines from a cropped address-only region.
 * Collect all non-noise lines up to 5.
 */
function parseCroppedAddress(lines: string[]): string | null {
  const parts = lines
    .map((l) => l.trim())
    .filter((l) => l && !NOISE.test(l))
    .slice(0, 5);
  return parts.length ? parts.join(", ") : null;
}

export async function extractIcFields(imageRef: string): Promise<IcExtractResult> {
  const isDataUrl = imageRef.startsWith("data:") && imageRef.includes("base64,");

  // Always do a full-card scan first — reliable for IC number
  const fullLines = await extractLines(imageRef);
  const base = parseMyKadLines(fullLines);

  if (!isDataUrl) return base;

  // For data URLs: crop each region, enhance, then run dedicated Textract calls
  try {
    const b64 = imageRef.split("base64,")[1]!;
    const inputBuf = Buffer.from(b64, "base64");

    const [nameBuf, addrBuf] = await Promise.all([
      cropAndEnhance(inputBuf, IC_REGIONS.fullName),
      cropAndEnhance(inputBuf, IC_REGIONS.address),
    ]);

    const [nameLines, addrLines] = await Promise.all([
      extractLinesFromBytes(nameBuf),
      extractLinesFromBytes(addrBuf),
    ]);

    const croppedName = parseCroppedName(nameLines);
    const croppedAddr = parseCroppedAddress(addrLines);

    return {
      icNumber: base.icNumber,
      fullName: croppedName ?? base.fullName,
      address: croppedAddr ?? base.address,
      rawLines: fullLines,
    };
  } catch {
    // Enhancement/crop failed — fall back to full-card parse
    return base;
  }
}

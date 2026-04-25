import { DetectDocumentTextCommand, TextractClient, type Block } from "@aws-sdk/client-textract";
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

/** Raw lines extracted from the document */
async function extractLines(imageRef: string): Promise<string[]> {
  const bytes = await imageBytesFromRef(imageRef);
  const out = await getClient().send(new DetectDocumentTextCommand({ Document: { Bytes: bytes } }));
  return (out.Blocks ?? [])
    .filter((b: Block) => b.BlockType === "LINE" && b.Text)
    .map((b: Block) => b.Text as string);
}

export interface IcExtractResult {
  icNumber: string | null;
  fullName: string | null;
  address: string | null;
  rawLines: string[];
}

/**
 * Malaysian IC (MyKad) field extraction.
 *
 * IC number format: YYMMDD-SS-NNNN  (12 digits, may appear with or without dashes)
 * Name appears on a line after "NAMA" or as the longest all-caps line.
 * Address lines follow "ALAMAT" or "ADDRESS".
 */
export async function extractIcFields(imageRef: string): Promise<IcExtractResult> {
  const lines = await extractLines(imageRef);

  // ── IC Number ──────────────────────────────────────────────────────────────
  const icRegex = /\b(\d{6}[-\s]?\d{2}[-\s]?\d{4})\b/;
  let icNumber: string | null = null;
  for (const line of lines) {
    const m = line.match(icRegex);
    if (m) {
      icNumber = m[1].replace(/[-\s]/g, ""); // normalise to 12 digits
      break;
    }
  }

  // ── Full Name ──────────────────────────────────────────────────────────────
  // Strategy: line immediately after a line containing "NAMA" / "NAME"
  let fullName: string | null = null;
  const namaIdx = lines.findIndex((l) => /\bNAMA\b|\bNAME\b/i.test(l));
  if (namaIdx !== -1 && lines[namaIdx + 1]) {
    fullName = lines[namaIdx + 1].trim();
  }
  // Fallback: longest all-caps line (typical for printed IC names)
  if (!fullName) {
    const capsLines = lines.filter((l) => /^[A-Z\s/]+$/.test(l.trim()) && l.trim().length > 4);
    if (capsLines.length) {
      fullName = capsLines.reduce((a, b) => (a.length >= b.length ? a : b)).trim();
    }
  }

  // ── Address ────────────────────────────────────────────────────────────────
  // Collect up to 4 lines after "ALAMAT" / "ADDRESS" / "ADDR"
  let address: string | null = null;
  const alamatIdx = lines.findIndex((l) => /\bALAMAT\b|\bADDRESS\b|\bADDR\b/i.test(l));
  if (alamatIdx !== -1) {
    const addrLines: string[] = [];
    for (let i = alamatIdx + 1; i < lines.length && addrLines.length < 4; i++) {
      const l = lines[i].trim();
      // Stop at known section headers
      if (/\b(TARIKH|DATE|JANTINA|GENDER|WARGANEGARA|NATIONALITY)\b/i.test(l)) break;
      if (l) addrLines.push(l);
    }
    if (addrLines.length) address = addrLines.join(", ");
  }

  return { icNumber, fullName, address, rawLines: lines };
}

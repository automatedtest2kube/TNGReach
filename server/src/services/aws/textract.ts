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
  // Strip noise lines
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
  // Name lines come right after the IC number.
  // A name line is all-caps letters/spaces/slashes, NOT a postcode, NOT noise.
  const nameLines: string[] = [];
  let cursor = icIdx + 1;
  while (cursor < clean.length) {
    const l = clean[cursor];
    if (POSTCODE.test(l)) break; // hit address postcode
    if (/\d/.test(l)) break; // contains digits → not a name
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
  // Address lines come after the name, up to (and including) the state line,
  // stopping before noise keywords.
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

export async function extractIcFields(imageRef: string): Promise<IcExtractResult> {
  const lines = await extractLines(imageRef);
  return parseMyKadLines(lines);
}

import { getConfig } from "../../config";
import { HttpError } from "../../lib/http-error";

/**
 * Call your OCR / document parsing layer (e.g. Alibaba OpenAPI, internal gateway, or a proxy in front of Alibaba OCR).
 * Wire ALIBABA_OCR_ENDPOINT to a service that accepts JSON { imageUrl | imageBase64, language? } and returns { text, blocks? }.
 */
export async function runOcrRequest(args: {
  imageUrl?: string;
  imageBase64?: string;
  language?: string;
}): Promise<{
  text: string;
  raw?: unknown;
}> {
  const config = getConfig();
  if (!config.ALIBABA_OCR_ENDPOINT) {
    throw new HttpError(
      503,
      "OCR is not configured (set ALIBABA_OCR_ENDPOINT)",
      "ocr_not_configured",
    );
  }
  const res = await fetch(config.ALIBABA_OCR_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      imageUrl: args.imageUrl,
      imageBase64: args.imageBase64,
      language: args.language,
    }),
  });
  if (!res.ok) {
    throw new HttpError(502, `OCR service error: ${res.status}`, "ocr_request_failed");
  }
  const data = (await res.json()) as { text?: string; raw?: unknown };
  if (!data.text) {
    return { text: JSON.stringify(data.raw ?? data), raw: data };
  }
  return { text: data.text, raw: data.raw };
}

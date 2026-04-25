import { DetectFacesCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

const maxBytes = 15 * 1024 * 1024;

let client: RekognitionClient | null = null;
function getClient() {
  if (!client) {
    client = new RekognitionClient(getAwsClientConfig());
  }
  return client;
}

async function imageBytesFromRef(inputRef: string): Promise<Uint8Array> {
  if (inputRef.startsWith("data:") && inputRef.includes("base64,")) {
    const b64 = inputRef.split("base64,")[1];
    if (!b64) {
      throw new HttpError(400, "Invalid data: URL for image", "invalid_image_data_url");
    }
    return Buffer.from(b64, "base64");
  }
  if (inputRef.startsWith("http://") || inputRef.startsWith("https://")) {
    const res = await fetch(inputRef);
    if (!res.ok) {
      throw new HttpError(400, `Could not download image: ${res.status}`, "image_fetch_failed");
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      throw new HttpError(400, "Image is larger than 15MB (Rekognition limit)", "image_too_large");
    }
    return buf;
  }
  throw new HttpError(
    400,
    "inputRef must be a https URL or a data: URL with base64 image",
    "invalid_input_ref",
  );
}

export type FaceResult = Awaited<ReturnType<typeof detectFacesForRef>>;

export async function detectFacesForRef(inputRef: string) {
  const bytes = await imageBytesFromRef(inputRef);
  const out = await getClient().send(
    new DetectFacesCommand({
      Image: { Bytes: bytes },
      Attributes: ["ALL"],
    }),
  );
  return {
    faceCount: out.FaceDetails?.length ?? 0,
    faceDetails: out.FaceDetails ?? [],
  };
}

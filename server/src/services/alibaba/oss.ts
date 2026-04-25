import OSS from "ali-oss";
import { getConfig, isOssConfigured, type AppConfig } from "../../config";
import { HttpError } from "../../lib/http-error";

function createClient(config: AppConfig) {
  if (!isOssConfigured(config)) {
    throw new HttpError(
      503,
      "Alibaba OSS is not configured (set ALIBABA_OSS_*)",
      "oss_not_configured",
    );
  }
  return new OSS({
    region: config.ALIBABA_OSS_REGION!,
    accessKeyId: config.ALIBABA_OSS_ACCESS_KEY_ID!,
    accessKeySecret: config.ALIBABA_OSS_ACCESS_KEY_SECRET!,
    bucket: config.ALIBABA_OSS_BUCKET!,
    ...(config.ALIBABA_OSS_ENDPOINT ? { endpoint: config.ALIBABA_OSS_ENDPOINT } : {}),
  });
}

export type PresignPutResult = {
  method: "PUT";
  objectKey: string;
  url: string;
  expiresInSeconds: number;
};

/**
 * V1 presigned URL for a direct browser or client upload to OSS.
 * For header-sensitive uploads (e.g. fixed Content-Type), use signature V4 in a follow-up.
 */
export function presignPutObject(args: {
  objectKey: string;
  expiresInSeconds?: number;
}): PresignPutResult {
  const config = getConfig();
  const client = createClient(config);
  const expires = args.expiresInSeconds ?? 3600;
  const url = client.signatureUrl(args.objectKey, { method: "PUT", expires });
  return {
    method: "PUT",
    objectKey: args.objectKey,
    url,
    expiresInSeconds: expires,
  };
}

/**
 * Time-limited download URL.
 */
export function presignGetObject(args: { objectKey: string; expiresInSeconds?: number }): string {
  const config = getConfig();
  const client = createClient(config);
  return client.signatureUrl(args.objectKey, {
    method: "GET",
    expires: args.expiresInSeconds ?? 600,
  });
}

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),

  ALIBABA_OSS_REGION: z.string().optional(),
  ALIBABA_OSS_ENDPOINT: z.string().optional(),
  ALIBABA_OSS_BUCKET: z.string().optional(),
  ALIBABA_OSS_ACCESS_KEY_ID: z.string().optional(),
  ALIBABA_OSS_ACCESS_KEY_SECRET: z.string().optional(),

  ALIBABA_MNS_QUEUE_URL: z.string().optional(),
  ALIBABA_MNS_ACCESS_KEY_ID: z.string().optional(),
  ALIBABA_MNS_ACCESS_KEY_SECRET: z.string().optional(),

  /** RecognizeCharacter / ocr – optional OpenAPI / proxy URL; extend when you wire a concrete API */
  ALIBABA_OCR_ENDPOINT: z.string().url().optional(),

  AWS_REGION: z.string().optional().default("ap-southeast-1"),
  AWS_DYNAMODB_LOGS_TABLE: z.string().optional(),
  AWS_LAMBDA_NAME: z.string().optional(),

  /** Optional override for S3/Transcribe – media must live in S3 for batch jobs */
  AWS_S3_MEDIA_BUCKET: z.string().optional(),
  AWS_SNS_TOPIC_ARN: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) {
    return cached;
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
  }
  if (parsed.data.NODE_ENV === "production" && !parsed.data.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when NODE_ENV=production");
  }
  cached = parsed.data;
  return cached;
}

export function isOssConfigured(config: AppConfig): boolean {
  return Boolean(
    config.ALIBABA_OSS_REGION &&
    config.ALIBABA_OSS_BUCKET &&
    config.ALIBABA_OSS_ACCESS_KEY_ID &&
    config.ALIBABA_OSS_ACCESS_KEY_SECRET,
  );
}

export function isMnsConfigured(config: AppConfig): boolean {
  return Boolean(
    config.ALIBABA_MNS_QUEUE_URL &&
    config.ALIBABA_MNS_ACCESS_KEY_ID &&
    config.ALIBABA_MNS_ACCESS_KEY_SECRET,
  );
}

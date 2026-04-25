import type { AppConfig } from "../config";
import { isMnsConfigured, isOssConfigured } from "../config";
import { isAwsAuthLikelyPresent } from "../services/aws/aws-auth";

export type IntegrationName =
  | "rds"
  | "alibaba.oss"
  | "alibaba.mns"
  | "alibaba.ocr"
  | "aws.rekognition"
  | "aws.polly"
  | "aws.transcribe"
  | "aws.sns"
  | "aws.eventbridge"
  | "aws.dynamodb"
  | "aws.lambda"
  | "aws.s3";

export function buildIntegrationStatus(
  config: AppConfig,
): Record<IntegrationName, "configured" | "not_configured"> {
  const rds: "configured" | "not_configured" = config.DATABASE_URL
    ? "configured"
    : "not_configured";
  const aws: "configured" | "not_configured" = isAwsAuthLikelyPresent()
    ? "configured"
    : "not_configured";
  return {
    rds,
    "alibaba.oss": isOssConfigured(config) ? "configured" : "not_configured",
    "alibaba.mns": isMnsConfigured(config) ? "configured" : "not_configured",
    "alibaba.ocr": config.ALIBABA_OCR_ENDPOINT ? "configured" : "not_configured",
    "aws.rekognition": aws,
    "aws.polly": aws,
    "aws.transcribe": aws,
    "aws.sns": aws,
    "aws.eventbridge": aws,
    "aws.dynamodb":
      aws === "configured" && config.AWS_DYNAMODB_LOGS_TABLE ? "configured" : "not_configured",
    "aws.lambda": aws === "configured" && config.AWS_LAMBDA_NAME ? "configured" : "not_configured",
    "aws.s3": aws === "configured" && config.AWS_S3_MEDIA_BUCKET ? "configured" : "not_configured",
  };
}

import { getConfig } from "../../config";
import { HttpError } from "../../lib/http-error";
import { isAwsAuthLikelyPresent } from "./aws-auth";

export function getAwsClientConfig() {
  const c = getConfig();
  if (!c.AWS_REGION) {
    throw new HttpError(503, "AWS_REGION is not set", "aws_region_missing");
  }
  if (!isAwsAuthLikelyPresent()) {
    throw new HttpError(503, "No AWS credentials in environment or role", "aws_auth_missing");
  }
  return { region: c.AWS_REGION };
}

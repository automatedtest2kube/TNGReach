/**
 * Heuristic: whether the default AWS SDK credential chain is likely to resolve.
 * Covers static keys, ECS task role, EC2, Lambda, web identity, etc.
 */
export function isAwsAuthLikelyPresent(): boolean {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return true;
  }
  if (process.env.AWS_PROFILE) {
    return true;
  }
  if (process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
    return true;
  }
  if (process.env.AWS_WEB_IDENTITY_TOKEN_FILE && process.env.AWS_ROLE_ARN) {
    return true;
  }
  if (process.env.AWS_EC2_METADATA_DISABLED !== "true" && process.env.NODE_ENV === "development") {
    // Local dev: might still have ~/.aws; avoid claiming metadata in prod without explicit env
  }
  return false;
}

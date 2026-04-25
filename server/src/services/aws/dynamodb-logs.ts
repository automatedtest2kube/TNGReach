import { DynamoDBClient, PutItemCommand, type PutItemCommandInput } from "@aws-sdk/client-dynamodb";
import { getConfig } from "../../config";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

let client: DynamoDBClient | null = null;
function getClient() {
  if (!client) {
    client = new DynamoDBClient(getAwsClientConfig());
  }
  return client;
}

/**
 * Optional analytics/audit log row in DynamoDB. Single-table: pk = id, attrs as strings.
 */
export async function putLogEntry(args: {
  id: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  requestId?: string;
  metadata?: Record<string, string>;
}): Promise<void> {
  const config = getConfig();
  if (!config.AWS_DYNAMODB_LOGS_TABLE) {
    throw new HttpError(
      503,
      "Set AWS_DYNAMODB_LOGS_TABLE to enable log writes",
      "dynamodb_logs_not_configured",
    );
  }
  const item: NonNullable<PutItemCommandInput["Item"]> = {
    id: { S: args.id },
    level: { S: args.level },
    message: { S: args.message },
    createdAt: { S: new Date().toISOString() },
  };
  if (args.requestId) {
    item.requestId = { S: args.requestId };
  }
  if (args.metadata) {
    for (const [k, v] of Object.entries(args.metadata)) {
      item[`m_${k}`] = { S: v };
    }
  }
  await getClient().send(
    new PutItemCommand({
      TableName: config.AWS_DYNAMODB_LOGS_TABLE,
      Item: item,
    }),
  );
}

import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { getConfig } from "../../config";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

let client: LambdaClient | null = null;
function getClient() {
  if (!client) {
    client = new LambdaClient(getAwsClientConfig());
  }
  return client;
}

export async function invokeByName<TPayload, TResult = unknown>(args: {
  functionName?: string;
  payload: TPayload;
}): Promise<{ statusCode: number; body: TResult }> {
  const config = getConfig();
  const name = args.functionName ?? config.AWS_LAMBDA_NAME;
  if (!name) {
    throw new HttpError(400, "Pass functionName or set AWS_LAMBDA_NAME", "lambda_name_missing");
  }
  const out = await getClient().send(
    new InvokeCommand({
      FunctionName: name,
      Payload: Buffer.from(JSON.stringify(args.payload)),
    }),
  );
  if (!out.Payload) {
    return { statusCode: out.StatusCode ?? 0, body: {} as TResult };
  }
  const text = new TextDecoder().decode(out.Payload);
  return {
    statusCode: out.StatusCode ?? 0,
    body: (text ? (JSON.parse(text) as TResult) : ({} as TResult)) as TResult,
  };
}

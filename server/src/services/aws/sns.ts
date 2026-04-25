import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { getConfig } from "../../config";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

let client: SNSClient | null = null;
function getClient() {
  if (!client) {
    client = new SNSClient(getAwsClientConfig());
  }
  return client;
}

export async function publishNotification(args: {
  topicArn?: string;
  message: string;
  subject?: string;
}) {
  const config = getConfig();
  const arn = args.topicArn ?? config.AWS_SNS_TOPIC_ARN;
  if (!arn) {
    throw new HttpError(400, "Pass topicArn or set AWS_SNS_TOPIC_ARN", "sns_topic_missing");
  }
  const out = await getClient().send(
    new PublishCommand({
      TopicArn: arn,
      Message: args.message,
      Subject: args.subject,
    }),
  );
  return { messageId: out.MessageId };
}

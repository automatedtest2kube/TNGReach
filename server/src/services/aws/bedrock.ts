import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
} from "@aws-sdk/client-bedrock-runtime";
import { getConfig } from "../../config";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

let client: BedrockRuntimeClient | null = null;

function getClient(): BedrockRuntimeClient {
  if (!client) {
    client = new BedrockRuntimeClient(getAwsClientConfig());
  }
  return client;
}

export type ChatRole = "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

function toBedrockMessages(messages: ChatMessage[]): Message[] {
  return messages.map((m) => ({
    role: m.role,
    content: [{ text: m.content }],
  }));
}

export async function chatWithBedrock(args: {
  messages: ChatMessage[];
  systemPrompt?: string;
  modelId?: string;
}): Promise<{ reply: string; modelId: string }> {
  const config = getConfig();
  const modelId = args.modelId ?? config.AWS_BEDROCK_MODEL_ID;
  if (!modelId) {
    throw new HttpError(
      503,
      "AWS_BEDROCK_MODEL_ID is not configured",
      "bedrock_model_id_missing",
    );
  }
  if (!args.messages.length) {
    throw new HttpError(400, "messages cannot be empty", "messages_empty");
  }

  const response = await getClient().send(
    new ConverseCommand({
      modelId,
      messages: toBedrockMessages(args.messages),
      system: args.systemPrompt ? [{ text: args.systemPrompt }] : undefined,
      inferenceConfig: {
        maxTokens: config.AWS_BEDROCK_MAX_TOKENS,
        temperature: config.AWS_BEDROCK_TEMPERATURE,
      },
    }),
  );

  const contents = response.output?.message?.content ?? [];
  const reply = contents
    .map((item) => ("text" in item && item.text ? item.text : ""))
    .join("\n")
    .trim();

  if (!reply) {
    throw new HttpError(502, "No reply content from Bedrock", "bedrock_empty_reply");
  }
  return { reply, modelId };
}

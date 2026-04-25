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

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const cleaned = messages
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .filter((m) => m.content.length > 0);

  // Bedrock Converse expects conversation to start with a user turn.
  const firstUserIndex = cleaned.findIndex((m) => m.role === "user");
  const sliced = firstUserIndex >= 0 ? cleaned.slice(firstUserIndex) : [];

  // Merge consecutive same-role messages to avoid invalid turn ordering.
  const merged: ChatMessage[] = [];
  for (const m of sliced) {
    const prev = merged.at(-1);
    if (prev && prev.role === m.role) {
      prev.content = `${prev.content}\n${m.content}`;
    } else {
      merged.push({ ...m });
    }
  }
  return merged;
}

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
  const normalizedMessages = normalizeMessages(args.messages);
  if (!normalizedMessages.length) {
    throw new HttpError(400, "At least one user message is required", "messages_missing_user");
  }

  let response;
  try {
    response = await getClient().send(
      new ConverseCommand({
        modelId,
        messages: toBedrockMessages(normalizedMessages),
        system: args.systemPrompt ? [{ text: args.systemPrompt }] : undefined,
        inferenceConfig: {
          maxTokens: config.AWS_BEDROCK_MAX_TOKENS,
          temperature: config.AWS_BEDROCK_TEMPERATURE,
        },
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bedrock request failed";
    throw new HttpError(502, `Bedrock error: ${message}`, "bedrock_request_failed");
  }

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

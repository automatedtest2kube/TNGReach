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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBedrockThrottled(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = error as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  if (e.$metadata?.httpStatusCode === 429) {
    return true;
  }
  const name = (e.name ?? "").toLowerCase();
  const message = (e.message ?? "").toLowerCase();
  return (
    name.includes("throttl") ||
    name.includes("toomanyrequest") ||
    message.includes("too many requests") ||
    message.includes("rate exceeded")
  );
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

  const command = new ConverseCommand({
    modelId,
    messages: toBedrockMessages(normalizedMessages),
    system: args.systemPrompt ? [{ text: args.systemPrompt }] : undefined,
    inferenceConfig: {
      maxTokens: config.AWS_BEDROCK_MAX_TOKENS,
      temperature: config.AWS_BEDROCK_TEMPERATURE,
    },
  });

  const maxAttempts = 4;
  let response;
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      response = await getClient().send(command);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      const throttled = isBedrockThrottled(error);
      const canRetry = throttled && attempt < maxAttempts;
      if (!canRetry) {
        break;
      }
      const backoffMs = 300 * 2 ** (attempt - 1) + Math.floor(Math.random() * 150);
      await sleep(backoffMs);
    }
  }
  if (!response) {
    const message = lastError instanceof Error ? lastError.message : "Bedrock request failed";
    if (isBedrockThrottled(lastError)) {
      throw new HttpError(429, `Bedrock error: ${message}`, "bedrock_request_failed");
    }
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

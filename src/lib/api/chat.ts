import { backendFetch } from "@/lib/api/backend";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatResponse = {
  reply: string;
  action: "send_money" | "pay_parking" | null;
  data?: Record<string, unknown>;
};

export async function sendChatMessage(messages: ChatMessage[], userId?: number): Promise<ChatResponse> {
  const res = await backendFetch("/api/v1/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, userId }),
  });
  if (!res.ok) {
    throw new Error(`Chat request failed (${res.status})`);
  }
  return (await res.json()) as ChatResponse;
}

export async function fetchPollyAudio(
  text: string,
  voiceId?: string,
): Promise<{ audioBase64: string; contentType: string }> {
  const res = await backendFetch("/api/v1/chat/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, voiceId }),
  });
  if (!res.ok) {
    throw new Error(`TTS request failed (${res.status})`);
  }
  return (await res.json()) as { audioBase64: string; contentType: string };
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string,
  languageCode?: string,
): Promise<string> {
  const res = await backendFetch("/api/v1/chat/transcribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType, languageCode }),
  });
  if (!res.ok) {
    throw new Error(`Transcribe request failed (${res.status})`);
  }
  const body = (await res.json()) as { transcript: string };
  return body.transcript;
}

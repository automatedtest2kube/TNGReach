import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { getAwsClientConfig } from "./region";

let client: PollyClient | null = null;
function getClient() {
  if (!client) {
    client = new PollyClient(getAwsClientConfig());
  }
  return client;
}

async function readAudioStream(stream: unknown): Promise<Buffer> {
  if (!stream) {
    return Buffer.alloc(0);
  }
  if (stream instanceof Uint8Array) {
    return Buffer.from(stream);
  }
  const chunks: Buffer[] = [];
  for await (const c of stream as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(c));
  }
  return Buffer.concat(chunks);
}

export type PollySynthesis = {
  audioBase64: string;
  contentType: string;
  characters: number;
};

export async function synthesizeToBase64(args: {
  text: string;
  voiceId?: string;
  outputFormat?: "mp3" | "ogg_vorbis" | "pcm";
}): Promise<PollySynthesis> {
  const out = await getClient().send(
    new SynthesizeSpeechCommand({
      Text: args.text,
      VoiceId: (args.voiceId ?? "Joanna") as "Joanna",
      OutputFormat: args.outputFormat ?? "mp3",
    }),
  );
  const buf = await readAudioStream(out.AudioStream);
  return {
    audioBase64: buf.toString("base64"),
    contentType: out.ContentType ?? "audio/mpeg",
    characters: args.text.length,
  };
}

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {
  GetTranscriptionJobCommand,
  StartTranscriptionJobCommand,
  TranscribeClient,
} from "@aws-sdk/client-transcribe";
import { randomUUID } from "node:crypto";
import { getConfig } from "../../config";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

let client: TranscribeClient | null = null;
function getClient() {
  if (!client) {
    client = new TranscribeClient(getAwsClientConfig());
  }
  return client;
}

let s3Client: S3Client | null = null;
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client(getAwsClientConfig());
  }
  return s3Client;
}

const jobNameSafe = (s: string) => s.replace(/[^0-9a-zA-Z._-]+/g, "-").slice(0, 200);

/**
 * Start a **batch** transcription job. Media must be in S3 and accessible from Transcribe.
 * For long-form or streaming input from OSS, copy object to S3 or use a separate streaming worker.
 */
function mediaFormatFromUri(s: string): "mp3" | "mp4" | "wav" | "flac" {
  const lower = s.split("?")[0]?.toLowerCase() ?? "";
  if (lower.endsWith(".mp3")) return "mp3";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4a")) return "mp4";
  if (lower.endsWith(".wav")) return "wav";
  if (lower.endsWith(".flac")) return "flac";
  return "mp3";
}

function mediaFormatFromMimeType(s: string): string {
  const lower = s.toLowerCase();
  if (lower.includes("mpeg") || lower.includes("mp3")) return "mp3";
  if (lower.includes("mp4") || lower.includes("m4a")) return "mp4";
  if (lower.includes("wav")) return "wav";
  if (lower.includes("flac")) return "flac";
  if (lower.includes("webm")) return "webm";
  if (lower.includes("ogg")) return "ogg";
  return "webm";
}

export async function startBatchTranscribeFromS3(args: {
  s3Uri: string;
  jobName?: string;
  languageCode?: string;
}) {
  if (!args.s3Uri.startsWith("s3://")) {
    throw new HttpError(400, "s3Uri must be s3://bucket/key", "invalid_s3_uri");
  }
  const name = jobNameSafe(args.jobName ?? `tngreach-${Date.now()}`);
  const out = await getClient().send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: name,
      Media: { MediaFileUri: args.s3Uri },
      MediaFormat: mediaFormatFromUri(args.s3Uri),
      LanguageCode: (args.languageCode as "en-US") ?? "en-US",
    }),
  );
  return {
    transcriptionJobName: out.TranscriptionJob?.TranscriptionJobName,
    jobStatus: out.TranscriptionJob?.TranscriptionJobStatus,
  };
}

async function waitForTranscriptionResult(args: {
  transcriptionJobName: string;
  timeoutMs?: number;
}): Promise<string> {
  const started = Date.now();
  const timeoutMs = args.timeoutMs ?? 60_000;

  while (Date.now() - started < timeoutMs) {
    const out = await getClient().send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: args.transcriptionJobName }),
    );
    const status = out.TranscriptionJob?.TranscriptionJobStatus;
    if (status === "COMPLETED") {
      const uri = out.TranscriptionJob?.Transcript?.TranscriptFileUri;
      if (!uri) {
        throw new HttpError(502, "Transcribe completed without transcript URI", "transcribe_no_uri");
      }
      const res = await fetch(uri);
      if (!res.ok) {
        throw new HttpError(502, "Failed to fetch transcript output", "transcribe_fetch_failed");
      }
      const body = (await res.json()) as {
        results?: { transcripts?: Array<{ transcript?: string }> };
      };
      const transcript = body.results?.transcripts?.[0]?.transcript?.trim();
      if (!transcript) {
        throw new HttpError(422, "No speech recognized", "transcribe_empty");
      }
      return transcript;
    }
    if (status === "FAILED") {
      throw new HttpError(
        502,
        out.TranscriptionJob?.FailureReason ?? "Transcription failed",
        "transcribe_failed",
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new HttpError(504, "Transcription timed out", "transcribe_timeout");
}

export async function transcribeShortAudioBase64(args: {
  audioBase64: string;
  mimeType?: string;
  languageCode?: string;
}): Promise<{ transcript: string; transcriptionJobName: string }> {
  const config = getConfig();
  if (!config.AWS_S3_MEDIA_BUCKET) {
    throw new HttpError(
      503,
      "AWS_S3_MEDIA_BUCKET is required for AWS Transcribe",
      "s3_media_bucket_missing",
    );
  }

  const mimeType = args.mimeType ?? "audio/webm";
  const mediaFormat = mediaFormatFromMimeType(mimeType);
  const key = `chat-audio/${Date.now()}-${randomUUID()}.${mediaFormat}`;
  const bytes = Buffer.from(args.audioBase64, "base64");

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: config.AWS_S3_MEDIA_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: mimeType,
    }),
  );

  const s3Uri = `s3://${config.AWS_S3_MEDIA_BUCKET}/${key}`;
  const transcriptionJobName = jobNameSafe(`chat-${Date.now()}-${randomUUID()}`);
  await getClient().send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: transcriptionJobName,
      Media: { MediaFileUri: s3Uri },
      MediaFormat: mediaFormat as "mp3",
      LanguageCode: (args.languageCode as "en-US") ?? "en-US",
    }),
  );

  const transcript = await waitForTranscriptionResult({ transcriptionJobName });
  return { transcript, transcriptionJobName };
}

import { StartTranscriptionJobCommand, TranscribeClient } from "@aws-sdk/client-transcribe";
import { HttpError } from "../../lib/http-error";
import { getAwsClientConfig } from "./region";

let client: TranscribeClient | null = null;
function getClient() {
  if (!client) {
    client = new TranscribeClient(getAwsClientConfig());
  }
  return client;
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

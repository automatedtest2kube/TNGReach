import { eq } from "drizzle-orm";
import { getConfig } from "../../config";
import { cloudJobs, type NewCloudJobRow } from "../../db/schema";
import type { AppDb } from "../../db/index";
import { HttpError } from "../../lib/http-error";
import { enqueueMessage } from "../alibaba/mns";
import { runOcrRequest } from "../alibaba/ocr";
import { putEvent } from "../aws/eventbridge";
import { putLogEntry } from "../aws/dynamodb-logs";
import { invokeByName } from "../aws/lambda";
import { synthesizeToBase64 } from "../aws/polly";
import { detectFacesForRef } from "../aws/rekognition";
import { publishNotification } from "../aws/sns";
import { startBatchTranscribeFromS3 } from "../aws/transcribe";

export const jobTypeValues = [
  "FACE_VERIFY",
  "OCR",
  "POLLY",
  "TRANSCRIBE",
  "SNS",
  "EVENTBRIDGE",
  "DYNAMO_LOG",
  "LAMBDA",
  "MNS_ENQUEUE",
] as const;
export type JobType = (typeof jobTypeValues)[number];

export type JobMetadata = {
  pollyText?: string;
  pollyVoiceId?: string;
  s3Uri?: string;
  snsMessage?: string;
  snsSubject?: string;
  snsTopicArn?: string;
  eventSource?: string;
  eventDetailType?: string;
  eventDetail?: unknown;
  lambdaPayload?: unknown;
  lambdaFunctionName?: string;
  mnsAction?: string;
  mnsPayload?: unknown;
  language?: string;
  imageBase64?: string;
  logMessage?: string;
} & Record<string, unknown>;

export async function runJob(
  db: AppDb,
  jobId: string,
  row: NewCloudJobRow,
): Promise<{ result: unknown; resultText: string }> {
  const config = getConfig();
  const baseMeta = (row.metadata ?? {}) as JobMetadata;
  const input = row.inputRef ?? "";

  switch (row.jobType as JobType) {
    case "FACE_VERIFY": {
      if (!input) {
        throw new HttpError(
          400,
          "inputRef (image URL or data URL) required for FACE_VERIFY",
          "missing_input",
        );
      }
      const r = await detectFacesForRef(input);
      return { result: r, resultText: JSON.stringify(r) };
    }
    case "OCR": {
      if (!input && !baseMeta.imageBase64) {
        throw new HttpError(
          400,
          "inputRef (imageUrl) or metadata.imageBase64 required for OCR",
          "missing_input",
        );
      }
      const o = await runOcrRequest({
        imageUrl: input || undefined,
        imageBase64: baseMeta.imageBase64,
        language: baseMeta.language,
      });
      return { result: o, resultText: o.text };
    }
    case "POLLY": {
      const text = baseMeta.pollyText;
      if (!text) {
        throw new HttpError(400, "metadata.pollyText required for POLLY", "missing_polly_text");
      }
      const p = await synthesizeToBase64({
        text,
        voiceId: baseMeta.pollyVoiceId,
        outputFormat: "mp3",
      });
      return { result: p, resultText: p.audioBase64 };
    }
    case "TRANSCRIBE": {
      const s3 = baseMeta.s3Uri ?? input;
      if (!s3) {
        throw new HttpError(
          400,
          "metadata.s3Uri or inputRef s3:// URI for TRANSCRIBE",
          "missing_s3",
        );
      }
      const t = await startBatchTranscribeFromS3({
        s3Uri: s3,
        jobName: jobId,
        languageCode: baseMeta.language as string | undefined,
      });
      return { result: t, resultText: JSON.stringify(t) };
    }
    case "SNS": {
      if (!baseMeta.snsMessage) {
        throw new HttpError(400, "metadata.snsMessage required", "missing_sns_message");
      }
      const s = await publishNotification({
        topicArn: baseMeta.snsTopicArn,
        message: baseMeta.snsMessage,
        subject: baseMeta.snsSubject ?? baseMeta.snsMessage.slice(0, 100),
      });
      return { result: s, resultText: JSON.stringify(s) };
    }
    case "EVENTBRIDGE": {
      if (!baseMeta.eventSource || !baseMeta.eventDetailType) {
        throw new HttpError(
          400,
          "metadata.eventSource and eventDetailType required",
          "missing_event_fields",
        );
      }
      const e = await putEvent({
        source: baseMeta.eventSource,
        detailType: baseMeta.eventDetailType,
        detail: baseMeta.eventDetail ?? { jobId },
      });
      return { result: e, resultText: JSON.stringify(e) };
    }
    case "DYNAMO_LOG": {
      await putLogEntry({
        id: jobId,
        level: "info",
        message: String(baseMeta.logMessage ?? "job"),
        requestId: row.requestId ?? undefined,
        metadata: { jobType: String(row.jobType), provider: String(row.provider) },
      });
      return { result: { ok: true }, resultText: "logged" };
    }
    case "LAMBDA": {
      if (baseMeta.lambdaPayload === undefined) {
        throw new HttpError(400, "metadata.lambdaPayload required", "missing_lambda_payload");
      }
      const l = await invokeByName({
        functionName: baseMeta.lambdaFunctionName ?? config.AWS_LAMBDA_NAME,
        payload: baseMeta.lambdaPayload,
      });
      return { result: l, resultText: JSON.stringify(l) };
    }
    case "MNS_ENQUEUE": {
      if (!baseMeta.mnsAction) {
        throw new HttpError(400, "metadata.mnsAction required", "missing_mns_action");
      }
      const q = await enqueueMessage({
        action: baseMeta.mnsAction,
        payload: baseMeta.mnsPayload ?? { jobId },
      });
      return { result: q, resultText: JSON.stringify(q) };
    }
    default: {
      throw new HttpError(400, `Unsupported jobType: ${row.jobType}`, "unsupported_job");
    }
  }
}

export async function markJobDone(
  db: AppDb,
  jobId: string,
  resultText: string,
  requestId: string | undefined,
): Promise<void> {
  await db
    .update(cloudJobs)
    .set({
      status: "DONE",
      resultRef: resultText.slice(0, 1_000_000),
      errorMessage: null,
      requestId: requestId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(cloudJobs.id, jobId));
}

export async function markJobFailed(
  db: AppDb,
  jobId: string,
  message: string,
  requestId: string | undefined,
): Promise<void> {
  await db
    .update(cloudJobs)
    .set({
      status: "FAILED",
      errorMessage: message.slice(0, 20000),
      requestId: requestId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(cloudJobs.id, jobId));
}

export async function markJobRunning(db: AppDb, jobId: string): Promise<void> {
  await db
    .update(cloudJobs)
    .set({ status: "RUNNING", updatedAt: new Date() })
    .where(eq(cloudJobs.id, jobId));
}

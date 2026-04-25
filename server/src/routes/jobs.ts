import { desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getDb, requireDb } from "../db";
import { cloudJobs } from "../db/schema";
import { HttpError } from "../lib/http-error";
import {
  jobTypeValues,
  markJobDone,
  markJobFailed,
  markJobRunning,
  runJob,
  type JobType,
} from "../services/jobs/process-job";
import type { HonoEnv } from "../types/hono-env";
import { Hono } from "hono";

const createBody = z.object({
  jobType: z.enum(jobTypeValues),
  /** Auto-derived from jobType if omitted. */
  provider: z.enum(["alibaba", "aws"]).optional(),
  inputRef: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  /** When true, run the job before responding (suitable for ECS; use queue for heavy work). @default true */
  sync: z.boolean().optional().default(true),
});

function inferProvider(t: JobType): "alibaba" | "aws" {
  if (t === "OCR" || t === "MNS_ENQUEUE") {
    return "alibaba";
  }
  return "aws";
}

export const jobsRoutes = new Hono<HonoEnv>();

jobsRoutes.get("/jobs", async (c) => {
  const db = getDb();
  if (!db) {
    throw new HttpError(503, "Database not configured", "db_unconfigured");
  }
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  const rows = await db.select().from(cloudJobs).orderBy(desc(cloudJobs.createdAt)).limit(limit);
  return c.json({ items: rows });
});

jobsRoutes.get("/jobs/:id", async (c) => {
  const db = getDb();
  if (!db) {
    throw new HttpError(503, "Database not configured", "db_unconfigured");
  }
  const id = c.req.param("id");
  const [row] = await db.select().from(cloudJobs).where(eq(cloudJobs.id, id));
  if (!row) {
    return c.json({ error: "not found" }, 404);
  }
  return c.json(row);
});

jobsRoutes.post("/jobs", async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = createBody.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const requestId = c.get("requestId");
  const db = requireDb();
  const provider = body.provider ?? inferProvider(body.jobType);

  const jobId = randomUUID();
  await db.insert(cloudJobs).values({
    id: jobId,
    jobType: body.jobType,
    provider,
    status: "PENDING",
    inputRef: body.inputRef ?? null,
    metadata: body.metadata ?? null,
    requestId,
  });
  const [inserted] = await db.select().from(cloudJobs).where(eq(cloudJobs.id, jobId));

  if (!inserted) {
    throw new HttpError(500, "Failed to create job", "insert_failed");
  }

  if (!body.sync) {
    return c.json(
      {
        job: inserted,
        note: "Created; process with worker or POST /jobs/:id/run in a later release",
      },
      201,
    );
  }

  await markJobRunning(db, inserted.id);
  try {
    const { resultText, result } = await runJob(db, inserted.id, {
      ...inserted,
      status: "RUNNING",
    });
    await markJobDone(db, inserted.id, resultText, requestId);
    const [done] = await db.select().from(cloudJobs).where(eq(cloudJobs.id, inserted.id));
    return c.json({ job: done, result }, 201);
  } catch (e) {
    const he = e instanceof HttpError ? e : null;
    const msg = e instanceof Error ? e.message : "unknown error";
    await markJobFailed(db, inserted.id, msg, requestId);
    const [failed] = await db.select().from(cloudJobs).where(eq(cloudJobs.id, inserted.id));
    return c.json(
      { job: failed, error: msg, code: he?.code ?? "job_failed" },
      (he ? he.status : 500) as never,
    );
  }
});

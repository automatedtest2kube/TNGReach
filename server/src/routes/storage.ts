import { z } from "zod";
import { HttpError } from "../lib/http-error";
import { presignGetObject, presignPutObject } from "../services/alibaba/oss";
import type { HonoEnv } from "../types/hono-env";
import { Hono } from "hono";

const putBody = z.object({
  objectKey: z.string().min(1).max(1024),
  expiresInSeconds: z.number().int().min(60).max(86400).optional(),
});

const getBody = z.object({
  objectKey: z.string().min(1).max(1024),
  expiresInSeconds: z.number().int().min(60).max(86400).optional(),
});

export const storageRoutes = new Hono<HonoEnv>();

storageRoutes.post("/oss/presign-put", async (c) => {
  const raw = await c.req.json().catch(() => null);
  const b = putBody.safeParse(raw);
  if (!b.success) {
    throw new HttpError(400, "Invalid body", "validation_error");
  }
  return c.json(presignPutObject(b.data));
});

storageRoutes.post("/oss/presign-get", async (c) => {
  const raw = await c.req.json().catch(() => null);
  const b = getBody.safeParse(raw);
  if (!b.success) {
    throw new HttpError(400, "Invalid body", "validation_error");
  }
  return c.json({ url: presignGetObject(b.data) });
});

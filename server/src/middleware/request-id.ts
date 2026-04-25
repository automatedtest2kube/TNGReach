import { randomUUID } from "node:crypto";
import { createMiddleware } from "hono/factory";
import type { HonoEnv } from "../types/hono-env";

export const requestIdMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const id = c.req.header("x-request-id")?.trim() || randomUUID();
  c.set("requestId", id);
  c.header("x-request-id", id);
  await next();
});

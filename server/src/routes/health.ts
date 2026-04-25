import { getConfig } from "../config";
import { dbHealth } from "../db";
import { buildIntegrationStatus } from "../lib/integration-status";
import type { HonoEnv } from "../types/hono-env";
import { Hono } from "hono";

export const healthRoutes = new Hono<HonoEnv>();

healthRoutes.get("/health", async (c) => {
  const config = getConfig();
  const d = await dbHealth();
  return c.json({
    ok: d !== "error",
    db: d,
    env: config.NODE_ENV,
    integrations: buildIntegrationStatus(config),
  });
});

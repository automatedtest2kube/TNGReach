import { getConfig } from "../config";
import { buildIntegrationStatus } from "../lib/integration-status";
import type { HonoEnv } from "../types/hono-env";
import { Hono } from "hono";

export const integrationRoutes = new Hono<HonoEnv>();

integrationRoutes.get("/integrations", (c) => {
  const config = getConfig();
  return c.json({ integrations: buildIntegrationStatus(config) });
});

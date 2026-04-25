import "dotenv/config";
import { serve } from "@hono/node-server";
import { getConfig } from "./config";
import { createApp } from "./app";
import { closePool } from "./db";

const config = getConfig();
const app = createApp();

const server = serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  (info) => {
    const addr = "address" in info && info.address ? String(info.address) : "0.0.0.0";
    console.log(`TNGReach API on http://${addr}:${info.port} (env=${config.NODE_ENV})`);
  },
);

const shutdown = async (signal: string) => {
  console.log(`Shutting down (${signal})...`);
  await closePool();
  server.close();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

import { Hono } from "hono";
import { cors } from "hono/cors";
import { getConfig } from "./config";
import { HttpError } from "./lib/http-error";
import { requestIdMiddleware } from "./middleware/request-id";
import { healthRoutes } from "./routes/health";
import { integrationRoutes } from "./routes/integrations";
import { jobsRoutes } from "./routes/jobs";
import { storageRoutes } from "./routes/storage";
import { usersRoutes } from "./routes/users";
import type { HonoEnv } from "./types/hono-env";

export function createApp() {
  const app = new Hono<HonoEnv>();
  const config = getConfig();

  app.onError((err, c) => {
    if (err instanceof HttpError) {
      return c.json({ error: err.message, code: err.code }, err.status as never);
    }
    console.error(err);
    return c.json({ error: "Internal error" }, 500) as never;
  });

  app.use("*", requestIdMiddleware);
  app.use(
    "*",
    cors({
      origin: config.CORS_ORIGIN ? [config.CORS_ORIGIN] : "*",
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["content-type", "x-request-id", "authorization"],
    }),
  );

  app.route("/", healthRoutes);
  app.route("/api/v1", integrationRoutes);
  app.route("/api/v1", jobsRoutes);
  app.route("/api/v1", storageRoutes);
  app.route("/api/v1", usersRoutes);

  return app;
}

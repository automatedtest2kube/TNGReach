import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("DATABASE_URL is not set. drizzle-kit needs it for push/migrate.");
}

export default defineConfig({
  schema: "./server/src/db/schema.ts",
  out: "./server/drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: url ?? "mysql://user:pass@127.0.0.1:3306/placeholder",
  },
});

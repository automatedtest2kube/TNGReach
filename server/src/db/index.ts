import { sql } from "drizzle-orm";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { getConfig } from "../config";
import { HttpError } from "../lib/http-error";
import * as schema from "./schema";

export type AppDb = MySql2Database<typeof schema>;

let pool: mysql.Pool | null = null;
let db: AppDb | null = null;

function init(): AppDb | null {
  if (db) {
    return db;
  }
  const config = getConfig();
  if (!config.DATABASE_URL) {
    return null;
  }
  pool = mysql.createPool({
    uri: config.DATABASE_URL,
    connectionLimit: 15,
  });
  db = drizzle(pool, { schema, mode: "default" });
  return db;
}

export function getDb(): AppDb | null {
  return init();
}

export function requireDb(): AppDb {
  const instance = init();
  if (!instance) {
    throw new HttpError(503, "Database not configured (set DATABASE_URL)", "db_unconfigured");
  }
  return instance;
}

export async function dbHealth(): Promise<"ok" | "unconfigured" | "error"> {
  const instance = getDb();
  if (!instance) {
    return "unconfigured";
  }
  try {
    await instance.execute(sql`select 1`);
    return "ok";
  } catch {
    return "error";
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

export { schema };

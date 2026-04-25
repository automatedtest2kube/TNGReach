import { index, json, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const cloudJobs = mysqlTable(
  "cloud_jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jobType: varchar("job_type", { length: 64 }).notNull(),
    provider: varchar("provider", { length: 32 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("PENDING"),
    inputRef: text("input_ref"),
    resultRef: text("result_ref"),
    errorMessage: text("error_message"),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    requestId: varchar("request_id", { length: 64 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("cloud_jobs_status_idx").on(t.status), index("cloud_jobs_type_idx").on(t.jobType)],
);

export type CloudJobRow = typeof cloudJobs.$inferSelect;
export type NewCloudJobRow = typeof cloudJobs.$inferInsert;

import {
  date,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

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

export const userProfile = mysqlTable("user_profile", {
  userId: int("user_id").autoincrement().primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  dateOfBirth: date("date_of_birth"),
  address: text("address"),
  icNumber: varchar("ic_number", { length: 12 }).unique(),
  passportNumber: varchar("passport_number", { length: 20 }).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const userFacesMetadata = mysqlTable(
  "user_faces_metadata",
  {
    faceId: int("face_id").autoincrement().primaryKey(),
    userId: int("user_id")
      .notNull()
      .references(() => userProfile.userId, { onDelete: "cascade" }),
    imageId: varchar("image_id", { length: 255 }),
    faceMatchScore: decimal("face_match_score", { precision: 5, scale: 2 }),
    rekognitionData: json("rekognition_data").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
  },
  (t) => [index("faces_user_idx").on(t.userId)],
);

export const walletBalance = mysqlTable("wallet_balance", {
  userId: int("user_id")
    .primaryKey()
    .references(() => userProfile.userId, { onDelete: "cascade" }),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0.00"),
  currency: varchar("currency", { length: 10 }).notNull().default("MYR"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow().onUpdateNow(),
});

export const transactionTypeEnum = mysqlEnum("transaction_type", [
  "SEND",
  "RECEIVE",
  "BILL_PAYMENT",
]);
export const transactionStatusEnum = mysqlEnum("transaction_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
]);

export const transactionData = mysqlTable(
  "transaction_data",
  {
    transactionId: int("transaction_id").autoincrement().primaryKey(),
    senderId: int("sender_id")
      .notNull()
      .references(() => userProfile.userId, { onDelete: "restrict" }),
    receiverId: int("receiver_id")
      .notNull()
      .references(() => userProfile.userId, { onDelete: "restrict" }),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    transactionType: transactionTypeEnum.notNull(),
    transactionStatus: transactionStatusEnum.notNull(),
    transactionDate: timestamp("transaction_date").notNull().defaultNow(),
    description: text("description"),
  },
  (t) => [
    index("txn_sender_idx").on(t.senderId),
    index("txn_receiver_idx").on(t.receiverId),
    index("txn_date_idx").on(t.transactionDate),
  ],
);

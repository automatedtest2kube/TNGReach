import { and, desc, eq, gte, like, lte, or } from "drizzle-orm";
import { compare, hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireDb } from "../db";
import { HttpError } from "../lib/http-error";
import { putLogEntry } from "../services/aws/dynamodb-logs";
import type { HonoEnv } from "../types/hono-env";
import { Hono } from "hono";
import { transactionData, userFacesMetadata, userProfile, walletBalance } from "../db/schema";

const createUserBody = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  phoneNumber: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  icNumber: z.string().max(12).optional(),
  passportNumber: z.string().max(20).optional(),
  age: z.number().int().min(0).max(120).optional(),
  incomeGroup: z.string().max(20).optional(),
  region: z.string().max(255).optional(),
  homeLon: z.number().min(-180).max(180).optional(),
  homeLat: z.number().min(-90).max(90).optional(),
  subsidies: z
    .array(z.object({ name: z.string().min(1), amount: z.number().nonnegative() }))
    .optional(),
  spendingByCategory: z.record(z.number().nonnegative()).optional(),
  currency: z.string().max(10).optional(),
});

const addFaceBody = z.object({
  imageId: z.string().max(255).optional(),
  faceMatchScore: z.number().min(0).max(100).optional(),
  rekognitionData: z.record(z.unknown()).optional(),
});

const topUpBody = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

const transferBody = z.object({
  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

const billBody = z.object({
  userId: z.number().int().positive(),
  amount: z.number().positive(),
  billerName: z.string().min(2).max(255),
  description: z.string().optional(),
});

const signUpBody = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phoneNumber: z.string().max(20).optional(),
});

const signInBody = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const transactionsQuery = z.object({
  userId: z.coerce.number().int().positive().optional(),
  senderId: z.coerce.number().int().positive().optional(),
  receiverId: z.coerce.number().int().positive().optional(),
  type: z.enum(["SEND", "RECEIVE", "BILL_PAYMENT"]).optional(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED"]).optional(),
  category: z.string().max(100).optional(),
  region: z.string().max(255).optional(),
  merchant: z.string().max(255).optional(),
  paymentMethod: z.string().max(100).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  minTimestampMs: z.coerce.number().int().nonnegative().optional(),
  maxTimestampMs: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

function decimalToNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) {
    return 0;
  }
  if (typeof v === "number") {
    return v;
  }
  return Number.parseFloat(v);
}

function toPublicUser(user: typeof userProfile.$inferSelect) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export const usersRoutes = new Hono<HonoEnv>();

usersRoutes.get("/transactions", async (c) => {
  const parsed = transactionsQuery.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }

  const q = parsed.data;
  const db = requireDb();
  const conditions = [];

  if (q.userId) {
    conditions.push(
      or(eq(transactionData.senderId, q.userId), eq(transactionData.receiverId, q.userId)),
    );
  }
  if (q.senderId) {
    conditions.push(eq(transactionData.senderId, q.senderId));
  }
  if (q.receiverId) {
    conditions.push(eq(transactionData.receiverId, q.receiverId));
  }
  if (q.type) {
    conditions.push(eq(transactionData.transactionType, q.type));
  }
  if (q.status) {
    conditions.push(eq(transactionData.transactionStatus, q.status));
  }
  if (q.category) {
    conditions.push(eq(transactionData.category, q.category));
  }
  if (q.region) {
    conditions.push(eq(transactionData.region, q.region));
  }
  if (q.merchant) {
    conditions.push(like(transactionData.merchant, `%${q.merchant}%`));
  }
  if (q.paymentMethod) {
    conditions.push(eq(transactionData.paymentMethod, q.paymentMethod));
  }

  const fromDate = q.from ? new Date(q.from) : null;
  const toDate = q.to ? new Date(q.to) : null;
  if (q.from && Number.isNaN(fromDate?.getTime())) {
    throw new HttpError(400, "from must be a valid date string", "invalid_from");
  }
  if (q.to && Number.isNaN(toDate?.getTime())) {
    throw new HttpError(400, "to must be a valid date string", "invalid_to");
  }
  if (fromDate) {
    conditions.push(gte(transactionData.transactionDate, fromDate));
  }
  if (toDate) {
    conditions.push(lte(transactionData.transactionDate, toDate));
  }
  if (q.minTimestampMs !== undefined) {
    conditions.push(gte(transactionData.timestampMs, q.minTimestampMs));
  }
  if (q.maxTimestampMs !== undefined) {
    conditions.push(lte(transactionData.timestampMs, q.maxTimestampMs));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const items = await db
    .select()
    .from(transactionData)
    .where(whereClause)
    .orderBy(desc(transactionData.transactionDate))
    .limit(q.limit);

  return c.json({ items, count: items.length });
});

usersRoutes.post("/auth/signup", async (c) => {
  const parsed = signUpBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const db = requireDb();
  const [existing] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.email, body.email))
    .limit(1);
  if (existing) {
    throw new HttpError(409, "Email already exists", "email_exists");
  }

  const passwordHash = await hash(body.password, 12);
  const [created] = await db
    .insert(userProfile)
    .values({
      fullName: body.fullName,
      email: body.email,
      passwordHash,
      phoneNumber: body.phoneNumber ?? null,
    })
    .$returningId();

  if (!created?.userId) {
    throw new HttpError(500, "Unable to create account", "signup_failed");
  }

  await db.insert(walletBalance).values({
    userId: created.userId,
    currency: "MYR",
    balance: "0.00",
  });

  return c.json({ userId: created.userId, email: body.email, fullName: body.fullName }, 201);
});

usersRoutes.post("/auth/signin", async (c) => {
  const parsed = signInBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const db = requireDb();
  const [user] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.email, body.email))
    .limit(1);
  if (!user?.passwordHash) {
    throw new HttpError(401, "Invalid credentials", "invalid_credentials");
  }

  const ok = await compare(body.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid credentials", "invalid_credentials");
  }

  return c.json({
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
  });
});

usersRoutes.post("/users", async (c) => {
  const parsed = createUserBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const db = requireDb();
  const requestId = c.get("requestId");
  const birthDate = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  if (body.dateOfBirth && Number.isNaN(birthDate?.getTime())) {
    throw new HttpError(400, "dateOfBirth must be a valid date string", "invalid_date_of_birth");
  }

  const [existing] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.email, body.email))
    .limit(1);
  if (existing) {
    throw new HttpError(409, "Email already exists", "email_exists");
  }

  const [created] = await db
    .insert(userProfile)
    .values({
      fullName: body.fullName,
      email: body.email,
      phoneNumber: body.phoneNumber ?? null,
      dateOfBirth: birthDate,
      address: body.address ?? null,
      icNumber: body.icNumber ?? null,
      passportNumber: body.passportNumber ?? null,
      age: body.age ?? null,
      incomeGroup: body.incomeGroup ?? null,
      region: body.region ?? null,
      homeLon: body.homeLon?.toFixed(6) ?? null,
      homeLat: body.homeLat?.toFixed(6) ?? null,
      subsidies: body.subsidies ?? null,
      spendingByCategory: body.spendingByCategory ?? null,
    })
    .$returningId();

  if (!created?.userId) {
    throw new HttpError(500, "Unable to create user", "create_user_failed");
  }

  await db.insert(walletBalance).values({
    userId: created.userId,
    currency: body.currency ?? "MYR",
    balance: "0.00",
  });

  try {
    await putLogEntry({
      id: randomUUID(),
      level: "info",
      message: "User created",
      requestId,
      metadata: { userId: String(created.userId), email: body.email },
    });
  } catch {
    // Keep user flow resilient even if optional external log is unavailable.
  }

  const [row] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, created.userId))
    .limit(1);
  return c.json({ user: row ? toPublicUser(row) : null }, 201);
});

usersRoutes.get("/users", async (c) => {
  const db = requireDb();
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 100, 1), 200);
  const rows = await db.select().from(userProfile).orderBy(desc(userProfile.userId)).limit(limit);
  return c.json({
    items: rows.map((u) => ({
      userId: u.userId,
      fullName: u.fullName,
      email: u.email,
      phoneNumber: u.phoneNumber ?? null,
    })),
  });
});

usersRoutes.get("/users/:id", async (c) => {
  const db = requireDb();
  const userId = Number(c.req.param("id"));
  if (!Number.isFinite(userId)) {
    throw new HttpError(400, "Invalid user id", "invalid_user_id");
  }

  const [user] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  if (!user) {
    return c.json({ error: "not found" }, 404);
  }
  const [wallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, userId))
    .limit(1);
  const tx = await db
    .select()
    .from(transactionData)
    .where(or(eq(transactionData.senderId, userId), eq(transactionData.receiverId, userId)))
    .orderBy(desc(transactionData.transactionDate))
    .limit(50);
  const faces = await db
    .select()
    .from(userFacesMetadata)
    .where(eq(userFacesMetadata.userId, userId))
    .orderBy(desc(userFacesMetadata.createdAt))
    .limit(20);

  return c.json({
    user: toPublicUser(user),
    wallet: wallet ?? null,
    transactions: tx,
    faces,
  });
});

usersRoutes.post("/users/:id/faces", async (c) => {
  const db = requireDb();
  const userId = Number(c.req.param("id"));
  if (!Number.isFinite(userId)) {
    throw new HttpError(400, "Invalid user id", "invalid_user_id");
  }
  const parsed = addFaceBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const [user] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  if (!user) {
    return c.json({ error: "not found" }, 404);
  }
  const body = parsed.data;
  const [created] = await db
    .insert(userFacesMetadata)
    .values({
      userId,
      imageId: body.imageId ?? null,
      faceMatchScore: body.faceMatchScore?.toFixed(2),
      rekognitionData: body.rekognitionData ?? null,
    })
    .$returningId();
  return c.json({ faceId: created?.faceId ?? null }, 201);
});

usersRoutes.get("/users/:id/transactions", async (c) => {
  const db = requireDb();
  const userId = Number(c.req.param("id"));
  if (!Number.isFinite(userId)) {
    throw new HttpError(400, "Invalid user id", "invalid_user_id");
  }
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 50, 1), 200);
  const tx = await db
    .select()
    .from(transactionData)
    .where(or(eq(transactionData.senderId, userId), eq(transactionData.receiverId, userId)))
    .orderBy(desc(transactionData.transactionDate))
    .limit(limit);
  return c.json({ items: tx });
});

usersRoutes.post("/wallet/topup", async (c) => {
  const db = requireDb();
  const parsed = topUpBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const [wallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, body.userId))
    .limit(1);
  if (!wallet) {
    throw new HttpError(404, "Wallet not found", "wallet_not_found");
  }
  const current = decimalToNumber(wallet.balance);
  const next = current + body.amount;
  await db
    .update(walletBalance)
    .set({ balance: next.toFixed(2) })
    .where(eq(walletBalance.userId, body.userId));
  await db.insert(transactionData).values({
    senderId: body.userId,
    receiverId: body.userId,
    amount: body.amount.toFixed(2),
    transactionType: "RECEIVE",
    transactionStatus: "COMPLETED",
    timestampMs: Date.now(),
    description: body.description ?? "Top up",
  });
  return c.json({ userId: body.userId, balance: next });
});

usersRoutes.post("/wallet/transfer", async (c) => {
  const db = requireDb();
  const parsed = transferBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  if (body.senderId === body.receiverId) {
    throw new HttpError(400, "Sender and receiver must differ", "invalid_transfer");
  }
  const [senderWallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, body.senderId))
    .limit(1);
  const [receiverWallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, body.receiverId))
    .limit(1);
  if (!senderWallet || !receiverWallet) {
    throw new HttpError(404, "Sender or receiver wallet not found", "wallet_not_found");
  }
  const senderBalance = decimalToNumber(senderWallet.balance);
  if (senderBalance < body.amount) {
    throw new HttpError(400, "Insufficient balance", "insufficient_balance");
  }
  const nextSender = senderBalance - body.amount;
  const nextReceiver = decimalToNumber(receiverWallet.balance) + body.amount;
  await db
    .update(walletBalance)
    .set({ balance: nextSender.toFixed(2) })
    .where(eq(walletBalance.userId, body.senderId));
  await db
    .update(walletBalance)
    .set({ balance: nextReceiver.toFixed(2) })
    .where(eq(walletBalance.userId, body.receiverId));
  await db.insert(transactionData).values({
    senderId: body.senderId,
    receiverId: body.receiverId,
    amount: body.amount.toFixed(2),
    transactionType: "SEND",
    transactionStatus: "COMPLETED",
    timestampMs: Date.now(),
    description: body.description ?? "Wallet transfer",
  });
  return c.json({
    senderId: body.senderId,
    receiverId: body.receiverId,
    senderBalance: nextSender,
    receiverBalance: nextReceiver,
  });
});

usersRoutes.post("/wallet/bill-payment", async (c) => {
  const db = requireDb();
  const parsed = billBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  const [wallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, body.userId))
    .limit(1);
  if (!wallet) {
    throw new HttpError(404, "Wallet not found", "wallet_not_found");
  }
  const balance = decimalToNumber(wallet.balance);
  if (balance < body.amount) {
    throw new HttpError(400, "Insufficient balance", "insufficient_balance");
  }
  const next = balance - body.amount;
  await db
    .update(walletBalance)
    .set({ balance: next.toFixed(2) })
    .where(eq(walletBalance.userId, body.userId));
  await db.insert(transactionData).values({
    senderId: body.userId,
    receiverId: body.userId,
    amount: body.amount.toFixed(2),
    transactionType: "BILL_PAYMENT",
    transactionStatus: "COMPLETED",
    timestampMs: Date.now(),
    description: body.description ?? `Bill payment: ${body.billerName}`,
  });
  return c.json({ userId: body.userId, balance: next });
});

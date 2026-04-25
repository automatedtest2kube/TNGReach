import { hash } from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { eq, or } from "drizzle-orm";
import { closePool, requireDb } from "../db";
import { transactionData, userProfile, walletBalance } from "../db/schema";

loadEnv({ path: "server/.env.local" });
loadEnv({ path: "server/.env.production" });

const DEMO_USER_ID = 1;
const SECOND_USER_ID = 2;

async function ensureUser(
  userId: number,
  fullName: string,
  email: string,
  phoneNumber: string,
  password: string,
): Promise<void> {
  const db = requireDb();
  const [existing] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  const passwordHash = await hash(password, 12);

  if (!existing) {
    await db.insert(userProfile).values({
      userId,
      fullName,
      email,
      phoneNumber,
      passwordHash,
    });
  }

  const [wallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, userId))
    .limit(1);
  if (!wallet) {
    await db.insert(walletBalance).values({
      userId,
      balance: "0.00",
      currency: "MYR",
    });
  }
}

async function seedTransactions(): Promise<void> {
  const db = requireDb();
  const existingForDemo = await db
    .select({ id: transactionData.transactionId })
    .from(transactionData)
    .where(or(eq(transactionData.senderId, DEMO_USER_ID), eq(transactionData.receiverId, DEMO_USER_ID)))
    .limit(1);

  if (existingForDemo.length > 0) {
    console.log("Seed skipped: demo transactions already exist.");
    return;
  }

  await db.insert(transactionData).values([
    {
      senderId: SECOND_USER_ID,
      receiverId: DEMO_USER_ID,
      amount: "2000.00",
      transactionType: "RECEIVE",
      transactionStatus: "COMPLETED",
      description: "Salary credit",
      transactionDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: DEMO_USER_ID,
      receiverId: SECOND_USER_ID,
      amount: "45.50",
      transactionType: "SEND",
      transactionStatus: "COMPLETED",
      description: "Groceries",
      transactionDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: DEMO_USER_ID,
      receiverId: SECOND_USER_ID,
      amount: "18.90",
      transactionType: "SEND",
      transactionStatus: "COMPLETED",
      description: "Coffee",
      transactionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: DEMO_USER_ID,
      receiverId: SECOND_USER_ID,
      amount: "120.00",
      transactionType: "BILL_PAYMENT",
      transactionStatus: "COMPLETED",
      description: "Electricity bill",
      transactionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: SECOND_USER_ID,
      receiverId: DEMO_USER_ID,
      amount: "350.00",
      transactionType: "RECEIVE",
      transactionStatus: "COMPLETED",
      description: "Bank top up",
      transactionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      senderId: DEMO_USER_ID,
      receiverId: SECOND_USER_ID,
      amount: "32.00",
      transactionType: "SEND",
      transactionStatus: "COMPLETED",
      description: "Restaurant",
      transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ]);

  await db
    .update(walletBalance)
    .set({
      balance: "2133.60",
      currency: "MYR",
    })
    .where(eq(walletBalance.userId, DEMO_USER_ID));

  await db
    .update(walletBalance)
    .set({
      balance: "500.00",
      currency: "MYR",
    })
    .where(eq(walletBalance.userId, SECOND_USER_ID));

  console.log("Seed complete: users, wallet balances, and transactions inserted.");
}

async function main(): Promise<void> {
  await ensureUser(
    DEMO_USER_ID,
    "Sarah Abdullah",
    "sarah.demo@tngreach.local",
    "0123456789",
    "DemoPass123!",
  );
  await ensureUser(
    SECOND_USER_ID,
    "Ahmad Rahman",
    "ahmad.demo@tngreach.local",
    "0198887766",
    "DemoPass123!",
  );
  await seedTransactions();
}

main()
  .catch((error: unknown) => {
    console.error("Failed to seed database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

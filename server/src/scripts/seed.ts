import { hash } from "bcryptjs";
import { config as loadEnv } from "dotenv";
import { eq, or } from "drizzle-orm";
import { closePool, requireDb } from "../db";
import { transactionData, userProfile, walletBalance } from "../db/schema";

loadEnv({ path: "server/.env.local" });
loadEnv({ path: "server/.env.production" });

const DEMO_USER_ID = 1;
const PEER_USER_ID = 2;

async function ensureUsers(): Promise<void> {
  const db = requireDb();
  const demoPasswordHash = await hash("DemoPass123!", 12);
  const peerPasswordHash = await hash("DemoPass123!", 12);

  const [demo] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, DEMO_USER_ID))
    .limit(1);
  if (!demo) {
    await db.insert(userProfile).values({
      userId: DEMO_USER_ID,
      fullName: "Aiman Tan",
      email: "aiman.demo@tngreach.local",
      passwordHash: demoPasswordHash,
      phoneNumber: "0123456789",
      icNumber: "900101141234",
      age: 35,
      incomeGroup: "M40",
      region: "W.P. Kuala Lumpur",
      homeLon: "101.693900",
      homeLat: "3.135700",
      subsidies: [
        { name: "Fuel Subsidy", amount: 120 },
        { name: "Electricity Subsidy", amount: 80 },
      ],
      spendingByCategory: {
        Food: 88,
        Transport: 72,
        Healthcare: 30,
        Clothes: 55,
        Essential: 12,
        Groceries: 64,
        Entertainment: 80,
      },
    });
  } else {
    await db
      .update(userProfile)
      .set({
        fullName: "Aiman Tan",
        age: 35,
        incomeGroup: "M40",
        region: "W.P. Kuala Lumpur",
        homeLon: "101.693900",
        homeLat: "3.135700",
        subsidies: [
          { name: "Fuel Subsidy", amount: 120 },
          { name: "Electricity Subsidy", amount: 80 },
        ],
        spendingByCategory: {
          Food: 88,
          Transport: 72,
          Healthcare: 30,
          Clothes: 55,
          Essential: 12,
          Groceries: 64,
          Entertainment: 80,
        },
      })
      .where(eq(userProfile.userId, DEMO_USER_ID));
  }

  const [peer] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, PEER_USER_ID))
    .limit(1);
  if (!peer) {
    await db.insert(userProfile).values({
      userId: PEER_USER_ID,
      fullName: "Nadia Rahman",
      email: "nadia.demo@tngreach.local",
      passwordHash: peerPasswordHash,
      phoneNumber: "0198887766",
      icNumber: "920202105678",
      age: 33,
      incomeGroup: "M40",
      region: "Selangor",
      homeLon: "101.518300",
      homeLat: "3.073800",
      subsidies: [{ name: "Transport Subsidy", amount: 60 }],
      spendingByCategory: { Food: 40, Transport: 52, Groceries: 35, Healthcare: 10 },
    });
  }

  const [demoWallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, DEMO_USER_ID))
    .limit(1);
  if (!demoWallet) {
    await db
      .insert(walletBalance)
      .values({ userId: DEMO_USER_ID, balance: "2458.50", currency: "MYR" });
  }

  const [peerWallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, PEER_USER_ID))
    .limit(1);
  if (!peerWallet) {
    await db
      .insert(walletBalance)
      .values({ userId: PEER_USER_ID, balance: "780.20", currency: "MYR" });
  }
}

async function seedTransactions(): Promise<void> {
  const db = requireDb();
  const existing = await db
    .select({ id: transactionData.transactionId })
    .from(transactionData)
    .where(
      or(eq(transactionData.senderId, DEMO_USER_ID), eq(transactionData.receiverId, DEMO_USER_ID)),
    )
    .limit(1);
  if (existing.length > 0) {
    console.log("Seed skipped: demo transactions already exist.");
    return;
  }

  const now = Date.now();
  await db.insert(transactionData).values([
    {
      externalTransactionId: "TX4532826",
      senderId: DEMO_USER_ID,
      receiverId: PEER_USER_ID,
      merchant: "Healthcare Box MY",
      category: "Healthcare",
      amount: "298.03",
      region: "W.P. Kuala Lumpur",
      lon: "101.669368",
      lat: "3.126736",
      timestampMs: now - 9 * 24 * 60 * 60 * 1000,
      transactionType: "SEND",
      transactionStatus: "COMPLETED",
      paymentMethod: "Linked CIMB Card",
      reference: "NFIP-7579787",
      description: "Healthcare purchase",
      transactionDate: new Date(now - 9 * 24 * 60 * 60 * 1000),
    },
    {
      externalTransactionId: "TX4532827",
      senderId: PEER_USER_ID,
      receiverId: DEMO_USER_ID,
      merchant: "Maybank Transfer",
      category: "Top Up",
      amount: "500.00",
      region: "W.P. Kuala Lumpur",
      lon: "101.686900",
      lat: "3.139000",
      timestampMs: now - 7 * 24 * 60 * 60 * 1000,
      transactionType: "RECEIVE",
      transactionStatus: "COMPLETED",
      paymentMethod: "DuitNow",
      reference: "TOPUP-20260418",
      description: "Wallet top up",
      transactionDate: new Date(now - 7 * 24 * 60 * 60 * 1000),
    },
    {
      externalTransactionId: "TX4532828",
      senderId: DEMO_USER_ID,
      receiverId: PEER_USER_ID,
      merchant: "RapidKL",
      category: "Transport",
      amount: "18.20",
      region: "W.P. Kuala Lumpur",
      lon: "101.701200",
      lat: "3.150400",
      timestampMs: now - 5 * 24 * 60 * 60 * 1000,
      transactionType: "SEND",
      transactionStatus: "COMPLETED",
      paymentMethod: "TNG eWallet",
      reference: "RAPIDKL-33922",
      description: "Train fare",
      transactionDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
    {
      externalTransactionId: "TX4532829",
      senderId: DEMO_USER_ID,
      receiverId: PEER_USER_ID,
      merchant: "Tenaga Nasional",
      category: "Essential",
      amount: "124.70",
      region: "W.P. Kuala Lumpur",
      lon: "101.708500",
      lat: "3.146200",
      timestampMs: now - 3 * 24 * 60 * 60 * 1000,
      transactionType: "BILL_PAYMENT",
      transactionStatus: "COMPLETED",
      paymentMethod: "Linked CIMB Card",
      reference: "TNB-APR-4421",
      description: "Electricity bill",
      transactionDate: new Date(now - 3 * 24 * 60 * 60 * 1000),
    },
  ]);
}

async function main(): Promise<void> {
  await ensureUsers();
  await seedTransactions();
  console.log("Seed complete.");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

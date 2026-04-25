import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireDb } from "../db";
import { HttpError } from "../lib/http-error";
import { transactionData, userProfile, walletBalance } from "../db/schema";
import { synthesizeToBase64 } from "../services/aws/polly";
import { transcribeShortAudioBase64 } from "../services/aws/transcribe";
import { chatWithBedrock } from "../services/aws/bedrock";
import type { HonoEnv } from "../types/hono-env";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(30),
  userId: z.number().int().positive().optional(),
  systemPrompt: z.string().min(1).max(2000).optional(),
  modelId: z.string().min(1).optional(),
});
const ttsBodySchema = z.object({
  text: z.string().min(1).max(3000),
  voiceId: z.string().min(1).optional(),
});
const transcribeBodySchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1).optional(),
  languageCode: z.string().min(2).max(16).optional(),
});

export const chatRoutes = new Hono<HonoEnv>();

function decimalToNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  return Number.parseFloat(v);
}

function cleanTargetName(raw: string): string {
  let s = raw
    .trim()
    .replace(/^[^a-zA-Z]+/, "")
    .replace(/[^a-zA-Z\s.'-]+$/g, "");
  const trailingNoise = ["please", "pls", "now", "thanks", "thank you", "lah", "ya"];
  let changed = true;
  while (changed) {
    changed = false;
    for (const noise of trailingNoise) {
      const next = s.replace(new RegExp(`\\s+${noise}$`, "i"), "").trim();
      if (next !== s) {
        s = next;
        changed = true;
      }
    }
  }
  return s;
}

function parseSendIntent(text: string): { amount: number; target: string } | null {
  const lower = text.toLowerCase();
  const hasSendKeyword = /\b(send|transfer|pay)\b/i.test(text);
  if (!hasSendKeyword) return null;
  if (/\bparking|parkir\b/i.test(text)) return null;

  const amountMatch = text.match(
    /(?:rm|myr|ringgit)\s*([\d]+(?:\.\d{1,2})?)|([\d]+(?:\.\d{1,2})?)\s*(?:rm|myr|ringgit)\b/i,
  );
  if (!amountMatch) return null;
  const amount = Number.parseFloat(amountMatch[1] ?? amountMatch[2] ?? "0");
  if (!Number.isFinite(amount) || amount <= 0) return null;

  let target = "";
  const explicitTarget = text.match(/\b(?:to|for)\s+([a-z][a-z\s.'-]{1,80})$/i);
  if (explicitTarget?.[1]) {
    target = cleanTargetName(explicitTarget[1]);
  } else {
    const sendThenName = text.match(
      /\b(?:send|transfer|pay)\s+([a-z][a-z\s.'-]{1,60})\s+(?:rm|myr|ringgit)?\s*[\d]/i,
    );
    if (sendThenName?.[1]) {
      target = cleanTargetName(sendThenName[1]);
    }
  }

  if (!target || target.length < 2) return null;
  if (/\b(parking|parkir)\b/i.test(target)) return null;
  if (!Number.isFinite(amount) || amount <= 0 || !target) return null;
  return { amount, target };
}

function parseParkingIntent(text: string): { amount: number } | null {
  const hasParkingKeyword = /\b(parking|parkir)\b/i.test(text);
  if (!hasParkingKeyword) return null;
  const rmAmount = text.match(/(?:rm|myr|ringgit)\s*([\d]+(?:\.\d{1,2})?)/i);
  const amount = rmAmount ? Number.parseFloat(rmAmount[1] ?? "0") : 6;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return { amount };
}

chatRoutes.post("/chat", async (c) => {
  const parsed = chatBodySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }

  const lastMessage = parsed.data.messages.at(-1);
  if (lastMessage?.role === "user" && parsed.data.userId) {
    const sendIntent = parseSendIntent(lastMessage.content);
    if (sendIntent) {
      const db = requireDb();
      const [senderWallet] = await db
        .select()
        .from(walletBalance)
        .where(eq(walletBalance.userId, parsed.data.userId))
        .limit(1);
      if (!senderWallet) {
        throw new HttpError(404, "Sender wallet not found", "wallet_not_found");
      }

      const users = await db.select().from(userProfile);
      const receiver = users.find(
        (u) => u.userId !== parsed.data.userId && u.fullName.toLowerCase().includes(sendIntent.target.toLowerCase()),
      );
      if (!receiver) {
        throw new HttpError(404, `User "${sendIntent.target}" not found`, "receiver_not_found");
      }

      const [receiverWallet] = await db
        .select()
        .from(walletBalance)
        .where(eq(walletBalance.userId, receiver.userId))
        .limit(1);
      if (!receiverWallet) {
        throw new HttpError(404, "Receiver wallet not found", "wallet_not_found");
      }

      const senderBalance = decimalToNumber(senderWallet.balance);
      if (senderBalance < sendIntent.amount) {
        throw new HttpError(400, "Insufficient balance", "insufficient_balance");
      }
      const nextSender = senderBalance - sendIntent.amount;
      const nextReceiver = decimalToNumber(receiverWallet.balance) + sendIntent.amount;

      await db
        .update(walletBalance)
        .set({ balance: nextSender.toFixed(2) })
        .where(eq(walletBalance.userId, parsed.data.userId));
      await db
        .update(walletBalance)
        .set({ balance: nextReceiver.toFixed(2) })
        .where(eq(walletBalance.userId, receiver.userId));
      await db.insert(transactionData).values({
        senderId: parsed.data.userId,
        receiverId: receiver.userId,
        amount: sendIntent.amount.toFixed(2),
        transactionType: "SEND",
        transactionStatus: "COMPLETED",
        timestampMs: Date.now(),
        description: `Chat transfer to ${receiver.fullName}`,
      });

      return c.json({
        reply: `Done. I sent RM ${sendIntent.amount.toFixed(2)} to ${receiver.fullName}.`,
        action: "send_money",
        data: {
          amount: sendIntent.amount,
          receiverName: receiver.fullName,
          senderBalance: nextSender,
        },
      });
    }

    const parkingIntent = parseParkingIntent(lastMessage.content);
    if (parkingIntent) {
      const db = requireDb();
      const [wallet] = await db
        .select()
        .from(walletBalance)
        .where(eq(walletBalance.userId, parsed.data.userId))
        .limit(1);
      if (!wallet) {
        throw new HttpError(404, "Wallet not found", "wallet_not_found");
      }
      const balance = decimalToNumber(wallet.balance);
      if (balance < parkingIntent.amount) {
        throw new HttpError(400, "Insufficient balance for parking", "insufficient_balance");
      }
      const nextBalance = balance - parkingIntent.amount;
      await db
        .update(walletBalance)
        .set({ balance: nextBalance.toFixed(2) })
        .where(eq(walletBalance.userId, parsed.data.userId));
      await db.insert(transactionData).values({
        senderId: parsed.data.userId,
        receiverId: parsed.data.userId,
        amount: parkingIntent.amount.toFixed(2),
        transactionType: "BILL_PAYMENT",
        transactionStatus: "COMPLETED",
        timestampMs: Date.now(),
        description: "Parking payment via chatbot",
        merchant: "City Parking",
        category: "Parking",
        paymentMethod: "TNG eWallet",
      });

      return c.json({
        reply: `Parking paid successfully. RM ${parkingIntent.amount.toFixed(2)} has been deducted.`,
        action: "pay_parking",
        data: { amount: parkingIntent.amount, balance: nextBalance },
      });
    }
  }

  const out = await chatWithBedrock(parsed.data);
  return c.json({
    reply: out.reply,
    model: out.modelId,
    action: null,
  });
});

chatRoutes.post("/chat/tts", async (c) => {
  const parsed = ttsBodySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const out = await synthesizeToBase64({
    text: parsed.data.text,
    voiceId: parsed.data.voiceId,
    outputFormat: "mp3",
  });
  return c.json(out);
});

chatRoutes.post("/chat/transcribe", async (c) => {
  const parsed = transcribeBodySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }
  const out = await transcribeShortAudioBase64(parsed.data);
  return c.json(out);
});

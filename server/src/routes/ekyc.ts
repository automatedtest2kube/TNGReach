import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireDb } from "../db";
import { HttpError } from "../lib/http-error";
import { extractIcFields } from "../services/aws/textract";
import type { HonoEnv } from "../types/hono-env";
import { userProfile, walletBalance } from "../db/schema";

export const ekycRoutes = new Hono<HonoEnv>();

/**
 * POST /api/v1/ekyc/scan-ic
 * Runs Textract on the IC image and returns extracted fields only.
 * Does NOT write anything to the database.
 */
ekycRoutes.post("/ekyc/scan-ic", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z.object({ imageRef: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }

  const extracted = await extractIcFields(parsed.data.imageRef);

  if (!extracted.icNumber) {
    throw new HttpError(422, "Could not detect an IC number in the image", "ic_number_not_found");
  }

  // fullName or address missing — return the partial result with needsReview=true
  // so the frontend can prompt the user to fill in the gaps manually
  return c.json({ extracted });
});

/**
 * POST /api/v1/ekyc/confirm
 * Saves the (user-reviewed) extracted fields to the database.
 * Call this only after the user has confirmed their details on the frontend.
 */
ekycRoutes.post("/ekyc/confirm", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = z
    .object({
      icNumber: z.string().min(12).max(12),
      fullName: z.string().min(2).max(255),
      address: z.string().optional(),
      email: z.string().email().optional(),
      phoneNumber: z.string().max(20).optional(),
      currency: z.string().max(10).optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "validation", details: parsed.error.flatten() }, 400);
  }

  const { icNumber, fullName, address, email, phoneNumber, currency } = parsed.data;
  const db = requireDb();

  // Idempotency — return existing profile if IC already registered
  const [existing] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.icNumber, icNumber))
    .limit(1);

  if (existing) {
    const [wallet] = await db
      .select()
      .from(walletBalance)
      .where(eq(walletBalance.userId, existing.userId))
      .limit(1);
    return c.json(
      {
        status: "existing",
        message: "IC already registered",
        user: existing,
        wallet: wallet ?? null,
      },
      200,
    );
  }

  // Create new user profile
  const [created] = await db
    .insert(userProfile)
    .values({
      fullName,
      email: email ?? null,
      phoneNumber: phoneNumber ?? null,
      address: address ?? null,
      icNumber,
    })
    .$returningId();

  if (!created?.userId) {
    throw new HttpError(500, "Failed to create user profile", "create_user_failed");
  }

  await db.insert(walletBalance).values({
    userId: created.userId,
    currency: currency ?? "MYR",
    balance: "0.00",
  });

  const [user] = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, created.userId))
    .limit(1);

  const [wallet] = await db
    .select()
    .from(walletBalance)
    .where(eq(walletBalance.userId, created.userId))
    .limit(1);

  return c.json(
    { status: "created", message: "User profile created", user, wallet: wallet ?? null },
    201,
  );
});

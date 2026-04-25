import { DEMO_USER_ID, fetchUserSummary } from "@/lib/api/wallet";

export interface UserProfile {
  id: string;
  fullName: string;
  preferredName: string;
  icOrPassportNo: string;
  accountMode: "normal" | "simple";
  phone: string;
  email: string;
  walletBalance: number;
  currency: string;
}

export const FALLBACK_USER_PROFILE: UserProfile = {
  id: "user-fallback",
  fullName: "User",
  preferredName: "User",
  icOrPassportNo: "",
  accountMode: "normal",
  phone: "",
  email: "",
  walletBalance: 0,
  currency: "MYR",
};

export async function fetchUserProfile(userId = DEMO_USER_ID): Promise<UserProfile> {
  const summary = await fetchUserSummary(userId);
  const fullName = summary.user.fullName || "User";
  return {
    id: String(summary.user.userId),
    fullName,
    preferredName: fullName.split(/\s+/)[0] || fullName,
    icOrPassportNo: "Not provided",
    accountMode: "normal",
    phone: "Not provided",
    email: summary.user.email,
    walletBalance: Number(summary.wallet?.balance ?? 0),
    currency: summary.wallet?.currency || "MYR",
  };
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

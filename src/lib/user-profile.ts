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

const MOCK_USER_PROFILE_URL = "/mock/user-profile.json";

export const FALLBACK_USER_PROFILE: UserProfile = {
  id: "user-fallback",
  fullName: "Sarah Ahmad",
  preferredName: "Sarah",
  icOrPassportNo: "880123-14-5678",
  accountMode: "normal",
  phone: "+60 12-345 6789",
  email: "sarah.ahmad@email.com",
  walletBalance: 2458.5,
  currency: "MYR",
};

export async function fetchUserProfile(): Promise<UserProfile> {
  // Placeholder integration point:
  // Replace this with your backend API call later, e.g.:
  // const response = await fetch("/api/v1/me");
  const response = await fetch(MOCK_USER_PROFILE_URL, { method: "GET" });
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  const data = (await response.json()) as UserProfile;
  return data;
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

import { backendFetch } from "@/lib/api/backend";

export type AuthResult = {
  userId: number;
  email: string;
  fullName: string;
};

export async function signUp(input: {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}): Promise<AuthResult> {
  const res = await backendFetch("/api/v1/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Sign up failed (${res.status})`);
  }
  return (await res.json()) as AuthResult;
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  const res = await backendFetch("/api/v1/auth/signin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "Invalid email or password");
  }
  return (await res.json()) as AuthResult;
}

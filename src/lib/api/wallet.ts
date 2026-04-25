import { backendFetch } from "@/lib/api/backend";

export const DEMO_USER_ID = 1;

export type TransactionRow = {
  transactionId: number;
  senderId: number;
  receiverId: number;
  amount: string | number;
  transactionType: "SEND" | "RECEIVE" | "BILL_PAYMENT";
  transactionStatus: "PENDING" | "COMPLETED" | "FAILED";
  transactionDate: string;
  description: string | null;
};

export type UserSummary = {
  user: {
    userId: number;
    fullName: string;
    email: string;
  };
  wallet: {
    userId: number;
    balance: string | number;
    currency: string;
  } | null;
  transactions: TransactionRow[];
};

export async function ensureDemoUser(): Promise<void> {
  const getRes = await backendFetch(`/api/v1/users/${DEMO_USER_ID}`);
  if (getRes.ok) {
    return;
  }
  if (getRes.status !== 404) {
    throw new Error(`Unable to query demo user (${getRes.status})`);
  }
  const createRes = await backendFetch("/api/v1/users", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fullName: "Sarah Abdullah",
      email: "sarah.demo@tngreach.local",
      phoneNumber: "0123456789",
      currency: "MYR",
    }),
  });
  if (!createRes.ok) {
    throw new Error(`Unable to create demo user (${createRes.status})`);
  }
}

export async function fetchUserSummary(userId = DEMO_USER_ID): Promise<UserSummary> {
  const res = await backendFetch(`/api/v1/users/${userId}`);
  if (!res.ok) {
    throw new Error(`Unable to fetch user summary (${res.status})`);
  }
  return (await res.json()) as UserSummary;
}

export async function fetchUserTransactions(
  userId = DEMO_USER_ID,
  limit = 100,
): Promise<TransactionRow[]> {
  const res = await backendFetch(`/api/v1/users/${userId}/transactions?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Unable to fetch transactions (${res.status})`);
  }
  const body = (await res.json()) as { items: TransactionRow[] };
  return body.items;
}

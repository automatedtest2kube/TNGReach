import type { Category } from "./regions";
import txnData from "./user-transactions.json";

export type IncomeGroup = "B40" | "M40" | "T20";
export type UserSubsidyName =
  | "Cash Aid (STR)"
  | "Grocery Subsidy (SARA)"
  | "Fuel Subsidy"
  | "Electricity Subsidy"
  | "Housing Assistance"
  | "eKasih Poverty Support"
  | "Rural/Hawker Subsidies"
  | "PTPTN";

export interface UserSubsidy {
  name: UserSubsidyName;
  amount: number;
}

export interface UserProfile {
  id: string;
  ic: string;
  name: string;
  age: number;
  incomeGroup: IncomeGroup;
  region: string;
  homeLon: number;
  homeLat: number;
  subsidies: UserSubsidy[];
  spendingByCategory: Record<Category, number>; // 0..100 normalized score
}

export const USERS: UserProfile[] = [
  {
    id: "u-001",
    ic: "900101-14-1234",
    name: "Aiman Tan",
    age: 35,
    incomeGroup: "M40",
    region: "W.P. Kuala Lumpur",
    homeLon: 101.6939,
    homeLat: 3.1357,
    subsidies: [
      { name: "Fuel Subsidy", amount: 120 },
      { name: "Electricity Subsidy", amount: 80 },
    ],
    spendingByCategory: { Food: 88, Transport: 72, Healthcare: 30, Clothes: 55, "Essential": 12, Groceries: 64, Entertainment: 80 },
  },
  {
    id: "u-002",
    ic: "920317-10-5678",
    name: "Siti Abdullah",
    age: 33,
    incomeGroup: "B40",
    region: "Selangor",
    homeLon: 101.5578,
    homeLat: 3.0733,
    subsidies: [
      { name: "Cash Aid (STR)", amount: 300 },
      { name: "Grocery Subsidy (SARA)", amount: 120 },
      { name: "eKasih Poverty Support", amount: 90 },
    ],
    spendingByCategory: { Food: 70, Transport: 45, Healthcare: 75, Clothes: 82, "Essential": 50, Groceries: 78, Entertainment: 40 },
  },
  {
    id: "u-003",
    ic: "880905-07-2468",
    name: "Wei Jin Lim",
    age: 38,
    incomeGroup: "T20",
    region: "Pulau Pinang",
    homeLon: 100.3354,
    homeLat: 5.4164,
    subsidies: [
      { name: "Fuel Subsidy", amount: 90 },
      { name: "PTPTN", amount: 250 },
    ],
    spendingByCategory: { Food: 92, Transport: 60, Healthcare: 18, Clothes: 35, "Essential": 22, Groceries: 70, Entertainment: 65 },
  },
  {
    id: "u-004",
    ic: "950622-01-1357",
    name: "Priya Raj",
    age: 30,
    incomeGroup: "M40",
    region: "Johor",
    homeLon: 103.7618,
    homeLat: 1.4927,
    subsidies: [
      { name: "Housing Assistance", amount: 220 },
      { name: "Electricity Subsidy", amount: 70 },
    ],
    spendingByCategory: { Food: 55, Transport: 88, Healthcare: 42, Clothes: 60, "Essential": 78, Groceries: 50, Entertainment: 30 },
  },
  {
    id: "u-005",
    ic: "870214-13-9753",
    name: "Daniel Wong",
    age: 39,
    incomeGroup: "B40",
    region: "Sarawak",
    homeLon: 110.3446,
    homeLat: 1.5535,
    subsidies: [
      { name: "Cash Aid (STR)", amount: 280 },
      { name: "Rural/Hawker Subsidies", amount: 150 },
      { name: "Grocery Subsidy (SARA)", amount: 120 },
    ],
    spendingByCategory: { Food: 48, Transport: 38, Healthcare: 12, Clothes: 28, "Essential": 8, Groceries: 60, Entertainment: 90 },
  },
  {
    id: "u-006",
    ic: "010728-08-4451",
    name: "Nurul Aisyah",
    age: 24,
    incomeGroup: "B40",
    region: "Kelantan",
    homeLon: 102.2386,
    homeLat: 6.1254,
    subsidies: [
      { name: "Cash Aid (STR)", amount: 350 },
      { name: "Grocery Subsidy (SARA)", amount: 120 },
      { name: "PTPTN", amount: 300 },
    ],
    spendingByCategory: { Food: 72, Transport: 34, Healthcare: 20, Clothes: 45, "Essential": 62, Groceries: 84, Entertainment: 30 },
  },
  {
    id: "u-007",
    ic: "791112-10-9021",
    name: "Mohd Faizal",
    age: 46,
    incomeGroup: "M40",
    region: "Selangor",
    homeLon: 101.5108,
    homeLat: 3.0738,
    subsidies: [
      { name: "Fuel Subsidy", amount: 200 },
      { name: "Electricity Subsidy", amount: 95 },
      { name: "Housing Assistance", amount: 180 },
    ],
    spendingByCategory: { Food: 68, Transport: 76, Healthcare: 48, Clothes: 40, "Essential": 52, Groceries: 66, Entertainment: 42 },
  },
  {
    id: "u-008",
    ic: "640403-04-3377",
    name: "Lim Siew Lan",
    age: 62,
    incomeGroup: "B40",
    region: "Perak",
    homeLon: 101.0901,
    homeLat: 4.5975,
    subsidies: [
      { name: "Cash Aid (STR)", amount: 450 },
      { name: "eKasih Poverty Support", amount: 200 },
      { name: "Electricity Subsidy", amount: 110 },
    ],
    spendingByCategory: { Food: 80, Transport: 25, Healthcare: 70, Clothes: 22, "Essential": 76, Groceries: 82, Entertainment: 18 },
  },
  {
    id: "u-009",
    ic: "970214-12-5549",
    name: "Gavin Lee",
    age: 29,
    incomeGroup: "T20",
    region: "W.P. Kuala Lumpur",
    homeLon: 101.7092,
    homeLat: 3.1586,
    subsidies: [
      { name: "Fuel Subsidy", amount: 100 },
      { name: "PTPTN", amount: 220 },
    ],
    spendingByCategory: { Food: 74, Transport: 82, Healthcare: 28, Clothes: 68, "Essential": 30, Groceries: 54, Entertainment: 88 },
  },
  {
    id: "u-010",
    ic: "830921-06-7782",
    name: "Rosmah Ibrahim",
    age: 42,
    incomeGroup: "B40",
    region: "Kedah",
    homeLon: 100.3729,
    homeLat: 6.1248,
    subsidies: [
      { name: "Cash Aid (STR)", amount: 320 },
      { name: "Rural/Hawker Subsidies", amount: 180 },
      { name: "Grocery Subsidy (SARA)", amount: 120 },
    ],
    spendingByCategory: { Food: 78, Transport: 36, Healthcare: 40, Clothes: 32, "Essential": 74, Groceries: 88, Entertainment: 26 },
  },
  {
    id: "u-011",
    ic: "561018-14-6635",
    name: "K. Rajendran",
    age: 69,
    incomeGroup: "M40",
    region: "Negeri Sembilan",
    homeLon: 101.9381,
    homeLat: 2.7297,
    subsidies: [
      { name: "Electricity Subsidy", amount: 130 },
      { name: "Housing Assistance", amount: 160 },
    ],
    spendingByCategory: { Food: 62, Transport: 30, Healthcare: 82, Clothes: 20, "Essential": 68, Groceries: 72, Entertainment: 24 },
  },
  {
    id: "u-012",
    ic: "020312-13-4810",
    name: "Darren Chua",
    age: 23,
    incomeGroup: "M40",
    region: "Sarawak",
    homeLon: 110.3671,
    homeLat: 1.5401,
    subsidies: [
      { name: "PTPTN", amount: 350 },
      { name: "Fuel Subsidy", amount: 85 },
    ],
    spendingByCategory: { Food: 66, Transport: 58, Healthcare: 18, Clothes: 52, "Essential": 36, Groceries: 60, Entertainment: 84 },
  },
  {
    id: "u-013",
    ic: "750627-07-5916",
    name: "Hajah Mariam",
    age: 50,
    incomeGroup: "B40",
    region: "Terengganu",
    homeLon: 103.137,
    homeLat: 5.3297,
    subsidies: [
      { name: "Cash Aid (STR)", amount: 340 },
      { name: "Grocery Subsidy (SARA)", amount: 120 },
      { name: "Rural/Hawker Subsidies", amount: 140 },
    ],
    spendingByCategory: { Food: 82, Transport: 33, Healthcare: 44, Clothes: 30, "Essential": 79, Groceries: 86, Entertainment: 20 },
  },
  {
    id: "u-014",
    ic: "890110-11-2744",
    name: "Azlan Iskandar",
    age: 36,
    incomeGroup: "T20",
    region: "Johor",
    homeLon: 103.7414,
    homeLat: 1.5146,
    subsidies: [
      { name: "Fuel Subsidy", amount: 140 },
      { name: "Electricity Subsidy", amount: 75 },
    ],
    spendingByCategory: { Food: 70, Transport: 86, Healthcare: 35, Clothes: 62, "Essential": 34, Groceries: 58, Entertainment: 72 },
  },
];

export interface UserTransaction {
  id: string;
  userId: string;
  merchant: string;
  category: Category;
  amount: number;
  region: string;
  lon: number;
  lat: number;
  timestamp: number;
  status: "completed" | "refunded";
  paymentMethod: string;
  reference: string;
}

const RAW_TXNS = txnData as Record<string, UserTransaction[]>;

// Shift mock timestamps so the newest transaction per user lands ~5 minutes ago.
// This keeps the static JSON usable as "live" data regardless of when it was generated.
const NOW = Date.now();
const FIVE_MIN = 5 * 60 * 1000;
const TXNS: Record<string, UserTransaction[]> = Object.fromEntries(
  Object.entries(RAW_TXNS).map(([uid, list]) => {
    if (!list.length) return [uid, list];
    const maxTs = Math.max(...list.map((t) => t.timestamp));
    const offset = NOW - FIVE_MIN - maxTs;
    return [uid, list.map((t) => ({ ...t, timestamp: t.timestamp + offset }))];
  })
);

export function getUserTransactions(userId: string): UserTransaction[] {
  return TXNS[userId] ?? [];
}

/** Free-text user lookup. Returns the best-matching user, or null. */
export function findUser(query: string): UserProfile | null {
  const q = query.trim().toLowerCase();
  const compact = q.replace(/[^0-9a-z]/g, "");
  if (!q) return null;
  const exactIc = USERS.find((u) => u.ic.toLowerCase() === q);
  if (exactIc) return exactIc;
  const exactIcCompact = USERS.find((u) => u.ic.replace(/[^0-9a-z]/gi, "").toLowerCase() === compact);
  if (exactIcCompact) return exactIcCompact;
  const prefix = USERS.find((u) => u.ic.toLowerCase().startsWith(q));
  if (prefix) return prefix;
  const sub = USERS.find((u) => u.ic.replace(/[^0-9a-z]/gi, "").toLowerCase().includes(compact));
  return sub ?? null;
}

export function suggestUsers(query: string, limit = 5): UserProfile[] {
  const q = query.trim().toLowerCase();
  const compact = q.replace(/[^0-9a-z]/g, "");
  if (!q) return [];
  return USERS.filter(
    (u) =>
      u.ic.toLowerCase().includes(q) ||
      u.ic.replace(/[^0-9a-z]/gi, "").toLowerCase().includes(compact)
  ).slice(0, limit);
}




// Mock e-wallet spending data per Malaysian state.
// Spending in RM (millions). Keys MUST match the GeoJSON `state` property.

export type Category =
  | "Food"
  | "Transport"
  | "Healthcare"
  | "Clothes"
  | "Essential"
  | "Groceries"
  | "Entertainment";

export const ALL_CATEGORIES: Category[] = [
  "Food",
  "Transport",
  "Healthcare",
  "Clothes",
  "Essential",
  "Groceries",
  "Entertainment",
];

export interface RegionStats {
  state: string;
  // spending breakdown by category in RM millions
  byCategory: Record<Category, number>;
  transactions: number; // total txns this period
  growth: number; // % vs previous period
  volumeIndex: number; // 0..200 normalized
}

const make = (
  state: string,
  total: number,
  txns: number,
  growth: number,
  index: number,
  weights: Partial<Record<Category, number>> = {}
): RegionStats => {
  // Default category mix
  const defaults: Record<Category, number> = {
    Food: 0.28,
    Transport: 0.18,
    Groceries: 0.22,
    Clothes: 0.12,
    Entertainment: 0.1,
    "Essential": 0.05,
    Healthcare: 0.05,
  };
  const mix = { ...defaults, ...weights };
  const sum = Object.values(mix).reduce((a, b) => a + b, 0);
  const byCategory = {} as Record<Category, number>;
  (Object.keys(mix) as Category[]).forEach((k) => {
    byCategory[k] = +(total * (mix[k]! / sum)).toFixed(2);
  });
  return { state, byCategory, transactions: txns, growth, volumeIndex: index };
};

export const REGIONS: RegionStats[] = [
  make("W.P. Kuala Lumpur", 982, 1_842_300, 14.2, 198, { Entertainment: 0.18, Food: 0.32 }),
  make("Selangor", 1_120, 2_104_900, 11.8, 192, { Groceries: 0.26, Food: 0.3 }),
  make("Pulau Pinang", 612, 1_182_700, 9.4, 156, { Food: 0.34 }),
  make("Johor", 745, 1_396_500, 8.1, 162, { Transport: 0.22 }),
  make("Melaka", 268, 489_300, 7.5, 118),
  make("Negeri Sembilan", 232, 421_700, 4.2, 102),
  make("Perak", 348, 632_400, 3.6, 96),
  make("Kedah", 218, 396_800, 2.1, 78),
  make("Pahang", 198, 358_900, 1.8, 72),
  make("Terengganu", 142, 257_600, -0.4, 58),
  make("Kelantan", 124, 222_400, -1.2, 52),
  make("Perlis", 48, 86_400, 0.9, 38),
  make("Sabah", 286, 521_900, 6.3, 88),
  make("Sarawak", 312, 568_400, 5.1, 92),
  make("W.P. Labuan", 32, 58_200, 2.8, 44),
  make("W.P. Putrajaya", 96, 174_300, 12.4, 138, { Food: 0.36 }),
];

export const REGION_BY_STATE = Object.fromEntries(REGIONS.map((r) => [r.state, r]));

export function totalSpending(r: RegionStats, cats?: Category[]): number {
  const list = cats && cats.length ? cats : ALL_CATEGORIES;
  return list.reduce((s, c) => s + (r.byCategory[c] ?? 0), 0);
}

export function heatColor(value: number, max: number): string {
  // returns a CSS HSL var name from heat-1 (low) to heat-6 (high)
  if (max <= 0) return "hsl(var(--heat-1))";
  const t = Math.min(1, value / max);
  const buckets = [
    "hsl(var(--heat-1))",
    "hsl(var(--heat-2))",
    "hsl(var(--heat-3))",
    "hsl(var(--heat-4))",
    "hsl(var(--heat-5))",
    "hsl(var(--heat-6))",
  ];
  // Use ^0.7 to give more contrast in mid-range
  const idx = Math.min(buckets.length - 1, Math.floor(Math.pow(t, 0.7) * buckets.length));
  return buckets[idx];
}

// Mock merchant + user names for particle drill-down
const FIRST = ["Aiman", "Siti", "Wei Jin", "Priya", "Daniel", "Nurul", "Hafiz", "Mei Ling", "Arjun", "Farah"];
const LAST = ["Tan", "Abdullah", "Lim", "Raj", "Wong", "Ismail", "Chong", "Hassan", "Devi", "Yusof"];
const MERCHANTS = [
  { name: "Mixue", category: "Food" as Category },
  { name: "Touch 'n Go Reload", category: "Transport" as Category },
  { name: "ZUS Coffee", category: "Food" as Category },
  { name: "Grab Ride", category: "Transport" as Category },
  { name: "AEON Big", category: "Groceries" as Category },
  { name: "Shopee Mall", category: "Clothes" as Category },
  { name: "Petsmart KL", category: "Essential" as Category },
  { name: "Sephora", category: "Healthcare" as Category },
  { name: "GSC Cinemas", category: "Entertainment" as Category },
  { name: "Family Mart", category: "Food" as Category },
];

let seed = 1;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
export function resetSeed(s = 1) { seed = s; }

export interface LiveTransaction {
  id: string;
  user: string;
  merchant: string;
  category: Category;
  amount: number;
  timestamp: number;
}

export function generateTxn(): LiveTransaction {
  const m = MERCHANTS[Math.floor(rand() * MERCHANTS.length)];
  const user = `${FIRST[Math.floor(rand() * FIRST.length)]} ${LAST[Math.floor(rand() * LAST.length)]}`;
  return {
    id: Math.random().toString(36).slice(2, 9),
    user,
    merchant: m.name,
    category: m.category,
    amount: +(rand() * 240 + 5).toFixed(2),
    timestamp: Date.now(),
  };
}




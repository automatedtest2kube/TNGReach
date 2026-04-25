import type { UserTransaction } from "./users";

export type SubsidyCategory =
  | "Cash Aid (STR)"
  | "Grocery Subsidy (SARA)"
  | "Fuel Subsidy"
  | "Electricity Subsidy"
  | "Housing Assistance"
  | "eKasih Poverty Support"
  | "Rural/Hawker Subsidies"
  | "PTPTN";

export const SUBSIDY_CATEGORIES: SubsidyCategory[] = [
  "Cash Aid (STR)",
  "Grocery Subsidy (SARA)",
  "Fuel Subsidy",
  "Electricity Subsidy",
  "Housing Assistance",
  "eKasih Poverty Support",
  "Rural/Hawker Subsidies",
  "PTPTN",
];

/**
 * Demo mapping from transaction traits to subsidy buckets.
 * This keeps filtering functional without changing the source JSON schema.
 */
export function inferSubsidyCategory(txn: UserTransaction): SubsidyCategory {
  const merchant = txn.merchant.toLowerCase();
  const method = txn.paymentMethod.toLowerCase();

  if (merchant.includes("petrol") || merchant.includes("fuel") || method.includes("fleet")) {
    return "Fuel Subsidy";
  }
  if (txn.category === "Groceries") return "Grocery Subsidy (SARA)";
  if (merchant.includes("electric") || merchant.includes("tenaga") || merchant.includes("utility")) {
    return "Electricity Subsidy";
  }
  if (merchant.includes("housing") || merchant.includes("rent") || merchant.includes("property")) {
    return "Housing Assistance";
  }
  if (merchant.includes("ptptn") || merchant.includes("education") || merchant.includes("campus")) {
    return "PTPTN";
  }
  if (merchant.includes("hawker") || merchant.includes("pasar") || merchant.includes("rural")) {
    return "Rural/Hawker Subsidies";
  }
  if (merchant.includes("ekasih") || merchant.includes("welfare")) {
    return "eKasih Poverty Support";
  }
  return "Cash Aid (STR)";
}


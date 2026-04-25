export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  relation: string;
  status: "active" | "pending";
  linkedAt: string;
}

interface FamilyInvitePayload {
  type: "family-link";
  inviteCode: string;
  inviterName: string;
  inviterPhone: string;
  createdAt: string;
}

const STORAGE_KEY = "tng-reach-family-members";
const LATEST_INVITE_KEY = "tng-reach-latest-family-invite";
const INVITE_REGISTRY_KEY = "tng-reach-family-invite-registry";

export const DEFAULT_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: "seed-1",
    name: "Aminah Rahman",
    relation: "Mother",
    phone: "+60 17-321 1234",
    status: "active",
    linkedAt: new Date().toISOString(),
  },
  {
    id: "seed-2",
    name: "Hassan Rahman",
    relation: "Father",
    phone: "+60 16-222 3344",
    status: "active",
    linkedAt: new Date().toISOString(),
  },
];

export function getFamilyMembers(): FamilyMember[] {
  if (typeof window === "undefined") return DEFAULT_FAMILY_MEMBERS;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_FAMILY_MEMBERS;
  try {
    const parsed = JSON.parse(raw) as FamilyMember[];
    return parsed.length > 0 ? parsed : DEFAULT_FAMILY_MEMBERS;
  } catch {
    return DEFAULT_FAMILY_MEMBERS;
  }
}

export function saveFamilyMembers(members: FamilyMember[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
}

export function addFamilyMember(member: Omit<FamilyMember, "id" | "linkedAt" | "status">): FamilyMember[] {
  const current = getFamilyMembers();
  const next: FamilyMember = {
    id: `family-${Date.now()}`,
    linkedAt: new Date().toISOString(),
    status: "active",
    ...member,
  };
  const updated = [next, ...current];
  saveFamilyMembers(updated);
  return updated;
}

export function createFamilyInvitePayload(inviterName: string, inviterPhone: string): string {
  const inviteCode = createFamilyInviteCode();
  const payload: FamilyInvitePayload = {
    type: "family-link",
    inviteCode,
    inviterName,
    inviterPhone,
    createdAt: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

export function setLatestFamilyInvitePayload(payload: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LATEST_INVITE_KEY, payload);
}

export function getLatestFamilyInvitePayload(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LATEST_INVITE_KEY);
}

function readInviteRegistry(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(INVITE_REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeInviteRegistry(registry: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INVITE_REGISTRY_KEY, JSON.stringify(registry));
}

export function createFamilyInviteCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function registerFamilyInvite(code: string, payload: string) {
  const registry = readInviteRegistry();
  registry[code.toUpperCase()] = payload;
  writeInviteRegistry(registry);
}

export function getFamilyInvitePayloadByCode(code: string): string | null {
  const registry = readInviteRegistry();
  return registry[code.toUpperCase()] ?? null;
}

export function createFamilyInviteQrValue(code: string): string {
  return `TNGREACH:FAMILY_INVITE:${code.toUpperCase()}`;
}

export function extractInviteCodeFromQrValue(raw: string): string | null {
  const value = raw.trim();
  const upper = value.toUpperCase();
  if (upper.startsWith("TNGREACH:FAMILY_INVITE:")) {
    return upper.split(":").pop()?.toUpperCase() ?? null;
  }
  // Backward compatibility: older JSON QR payload shape.
  const parsed = parseFamilyInvitePayload(value);
  if (parsed?.inviteCode) {
    return parsed.inviteCode.toUpperCase();
  }
  // Backward compatibility in case plain code is scanned.
  if (/^[A-Z0-9]{6,10}$/.test(upper)) {
    return upper;
  }
  return null;
}

export interface InviteLookupResult {
  inviteCode: string;
  inviterName: string;
  inviterPhone: string;
}

export async function lookupFamilyInviteByCode(inviteCode: string): Promise<InviteLookupResult | null> {
  // Placeholder for backend lookup:
  // Replace this with API call, e.g. GET /api/family-invites/:inviteCode
  const payload = getFamilyInvitePayloadByCode(inviteCode);
  if (!payload) return null;
  const parsed = parseFamilyInvitePayload(payload);
  if (!parsed) return null;
  return {
    inviteCode: inviteCode.toUpperCase(),
    inviterName: parsed.inviterName,
    inviterPhone: parsed.inviterPhone,
  };
}

export function parseFamilyInvitePayload(raw: string): FamilyInvitePayload | null {
  try {
    const payload = JSON.parse(raw) as FamilyInvitePayload;
    return payload.type === "family-link" ? payload : null;
  } catch {
    return null;
  }
}

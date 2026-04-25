export type BackendHealth = {
  ok: boolean;
  db: "ok" | "unconfigured" | "error";
  env: string;
  integrations: Record<string, "configured" | "not_configured">;
};

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

export function getBackendBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!raw) {
    return "";
  }
  return normalizeBaseUrl(raw);
}

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const base = getBackendBaseUrl();
  const target = `${base}${path}`;
  return fetch(target, init);
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const res = await backendFetch("/health", {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Backend health request failed (${res.status})`);
  }
  return (await res.json()) as BackendHealth;
}

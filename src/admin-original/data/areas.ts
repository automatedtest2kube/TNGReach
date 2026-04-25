export const AREAS_BY_STATE: Record<string, string[]> = {
  "Selangor": [
    "Rawang",
    "Puchong",
    "Cheras",
    "Bukit Jalil",
    "Shah Alam",
    "Klang",
    "Petaling Jaya",
    "Subang Jaya",
  ],
  "W.P. Kuala Lumpur": [
    "Bukit Bintang",
    "Bangsar",
    "Cheras",
    "Bukit Jalil",
    "Setapak",
    "Kepong",
  ],
  "Pulau Pinang": ["George Town", "Bayan Lepas", "Butterworth"],
  "Johor": ["Johor Bahru", "Skudai", "Kulai"],
  "Sarawak": ["Kuching", "Sibu", "Miri"],
};

const AREA_CENTROIDS: Record<
  string,
  Record<string, { lon: number; lat: number }>
> = {
  "Selangor": {
    "Rawang": { lon: 101.576, lat: 3.321 },
    "Puchong": { lon: 101.618, lat: 3.032 },
    "Cheras": { lon: 101.742, lat: 3.085 },
    "Bukit Jalil": { lon: 101.689, lat: 3.056 },
    "Shah Alam": { lon: 101.533, lat: 3.073 },
    "Klang": { lon: 101.445, lat: 3.044 },
    "Petaling Jaya": { lon: 101.607, lat: 3.108 },
    "Subang Jaya": { lon: 101.585, lat: 3.044 },
  },
  "W.P. Kuala Lumpur": {
    "Bukit Bintang": { lon: 101.712, lat: 3.146 },
    "Bangsar": { lon: 101.679, lat: 3.13 },
    "Cheras": { lon: 101.742, lat: 3.104 },
    "Bukit Jalil": { lon: 101.689, lat: 3.056 },
    "Setapak": { lon: 101.724, lat: 3.195 },
    "Kepong": { lon: 101.64, lat: 3.218 },
  },
  "Pulau Pinang": {
    "George Town": { lon: 100.33, lat: 5.414 },
    "Bayan Lepas": { lon: 100.279, lat: 5.296 },
    "Butterworth": { lon: 100.364, lat: 5.399 },
  },
  "Johor": {
    "Johor Bahru": { lon: 103.763, lat: 1.492 },
    "Skudai": { lon: 103.658, lat: 1.537 },
    "Kulai": { lon: 103.603, lat: 1.656 },
  },
  "Sarawak": {
    "Kuching": { lon: 110.344, lat: 1.553 },
    "Sibu": { lon: 111.834, lat: 2.289 },
    "Miri": { lon: 113.991, lat: 4.399 },
  },
};

function sqr(x: number): number {
  return x * x;
}

export function inferAreaFromPoint(state: string, lon: number, lat: number): string | null {
  const centroids = AREA_CENTROIDS[state];
  if (!centroids) return null;
  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const [area, p] of Object.entries(centroids)) {
    const score = sqr(lon - p.lon) + sqr(lat - p.lat);
    if (score < bestScore) {
      best = area;
      bestScore = score;
    }
  }
  return best;
}

export function getAreaOptionsForStates(states: string[]): string[] {
  if (!states.length) return [];
  const out = new Set<string>();
  for (const s of states) {
    for (const area of AREAS_BY_STATE[s] ?? []) out.add(`${s}::${area}`);
  }
  return Array.from(out);
}

export function parseAreaKey(key: string): { state: string; area: string } | null {
  const idx = key.indexOf("::");
  if (idx <= 0) return null;
  return { state: key.slice(0, idx), area: key.slice(idx + 2) };
}


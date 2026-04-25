import { useSyncExternalStore } from "react";

export type RequestPurpose = "Medical" | "Food" | "Business" | "Other";
export type VerificationMethod = "ic_face" | null;

export interface RequestorUpdate {
  id: string;
  text: string;
  date: string;
}

export interface RequestorCampaign {
  id: string;
  purpose: RequestPurpose;
  title: string;
  story: string;
  goal: number;
  image: string | null;
  verification: VerificationMethod;
  raised: number;
  supporters: number;
  createdAt: string;
  updates: RequestorUpdate[];
}

interface RequestorState {
  campaigns: RequestorCampaign[];
  loggedIn: boolean;
  name: string;
}

let state: RequestorState = {
  campaigns: [],
  loggedIn: false,
  name: "",
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const fmtDate = () => new Date().toLocaleDateString("en-MY", { day: "numeric", month: "short" });

// Simulate organic growth so the dashboard feels alive
const tickGrowth = () => {
  if (state.campaigns.length === 0) return;
  state = {
    ...state,
    campaigns: state.campaigns.map((c) => {
      if (c.raised >= c.goal) return c;
      const bump = Math.floor(Math.random() * 6) + 2;
      const newRaised = Math.min(c.goal, c.raised + bump);
      const newSupporters = c.supporters + (Math.random() > 0.55 ? 1 : 0);
      return { ...c, raised: newRaised, supporters: newSupporters };
    }),
  };
  emit();
};

if (typeof window !== "undefined") {
  setInterval(tickGrowth, 7000);
}

export const requestorStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  login(name: string) {
    state = { ...state, loggedIn: true, name: name || "Friend" };
    emit();
  },
  logout() {
    state = { ...state, loggedIn: false, name: "" };
    emit();
  },
  createCampaign(
    input: Omit<RequestorCampaign, "id" | "raised" | "supporters" | "createdAt" | "updates">,
  ) {
    const c: RequestorCampaign = {
      ...input,
      id: `r-${Date.now()}`,
      raised: 0,
      supporters: 0,
      createdAt: fmtDate(),
      updates: [{ id: `u-${Date.now()}`, text: "Campaign posted 🎉", date: "Just now" }],
    };
    state = { ...state, campaigns: [c, ...state.campaigns] };
    emit();
    return c.id;
  },
  addUpdate(campaignId: string, text: string) {
    state = {
      ...state,
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              updates: [{ id: `u-${Date.now()}`, text, date: "Just now" }, ...c.updates],
            }
          : c,
      ),
    };
    emit();
  },
};

export function useRequestorStore() {
  return useSyncExternalStore(
    requestorStore.subscribe,
    requestorStore.getSnapshot,
    requestorStore.getSnapshot,
  );
}

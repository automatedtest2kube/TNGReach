import { useSyncExternalStore } from "react";
import { CAMPAIGNS, type Campaign } from "./mock-data";

interface DonorState {
  campaigns: Campaign[];
  followed: Set<string>;
  donatedTo: Set<string>;
  totalDonated: number;
  donationCount: number;
}

let state: DonorState = {
  campaigns: CAMPAIGNS.map((c) => ({ ...c, updates: [...c.updates] })),
  followed: new Set(),
  donatedTo: new Set(),
  totalDonated: 0,
  donationCount: 0,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const donorStore = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getSnapshot: () => state,
  donate(id: string, amount: number) {
    state = {
      ...state,
      campaigns: state.campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              raised: Math.min(c.goal, c.raised + amount),
              supporters: state.donatedTo.has(id) ? c.supporters : c.supporters + 1,
            }
          : c,
      ),
      donatedTo: new Set(state.donatedTo).add(id),
      totalDonated: state.totalDonated + amount,
      donationCount: state.donationCount + 1,
    };
    emit();
  },
  toggleFollow(id: string) {
    const next = new Set(state.followed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    state = { ...state, followed: next };
    emit();
  },
};

export function useDonorStore() {
  return useSyncExternalStore(donorStore.subscribe, donorStore.getSnapshot, donorStore.getSnapshot);
}

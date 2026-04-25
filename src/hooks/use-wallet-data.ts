import { useEffect, useState } from "react";
import { DEMO_USER_ID, ensureDemoUser, fetchUserSummary, type UserSummary } from "@/lib/api/wallet";

type WalletDataState = {
  loading: boolean;
  error: string | null;
  summary: UserSummary | null;
};

const initialState: WalletDataState = {
  loading: true,
  error: null,
  summary: null,
};

export function useWalletData(userId = DEMO_USER_ID, refreshKey = 0): WalletDataState {
  const [state, setState] = useState<WalletDataState>(initialState);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        await ensureDemoUser();
        const summary = await fetchUserSummary(userId);
        if (!alive) {
          return;
        }
        setState({ loading: false, error: null, summary });
      } catch (err) {
        if (!alive) {
          return;
        }
        setState({
          loading: false,
          error: err instanceof Error ? err.message : "Failed to fetch wallet data",
          summary: null,
        });
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [userId, refreshKey]);

  return state;
}

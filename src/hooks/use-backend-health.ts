import { useEffect, useState } from "react";
import { fetchBackendHealth, type BackendHealth } from "@/lib/api/backend";

type BackendHealthState = {
  loading: boolean;
  data: BackendHealth | null;
  error: string | null;
};

const initialState: BackendHealthState = {
  loading: true,
  data: null,
  error: null,
};

export function useBackendHealth(pollMs = 30000): BackendHealthState {
  const [state, setState] = useState<BackendHealthState>(initialState);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const data = await fetchBackendHealth();
        if (!alive) {
          return;
        }
        setState({ loading: false, data, error: null });
      } catch (err) {
        if (!alive) {
          return;
        }
        setState({
          loading: false,
          data: null,
          error: err instanceof Error ? err.message : "Unable to reach backend",
        });
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, pollMs);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [pollMs]);

  return state;
}

import { useMemo } from "react";
import { REGIONS, totalSpending, type Category } from "@/admin-original/data/regions";
import { USERS, type UserTransaction } from "@/admin-original/data/users";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Props {
  categories: Category[];
  selectedRegion: string | null;
  onSelectRegion: (s: string | null) => void;
  filteredRegions?: string[];
  userTransactions?: UserTransaction[];
}

export const TopRegionsPanel = ({
  categories,
  selectedRegion,
  onSelectRegion,
  filteredRegions = [],
  userTransactions = [],
}: Props) => {
  const hasRegionFilter = filteredRegions.length > 0;
  const scopedRegions = hasRegionFilter
    ? REGIONS.filter((r) => filteredRegions.includes(r.state))
    : REGIONS;
  const ranked = useMemo(
    () =>
      [...scopedRegions]
        .map((r) => ({ ...r, spend: totalSpending(r, categories) }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5),
    [scopedRegions, categories]
  );

  const max = ranked[0]?.spend || 1;
  const insights = useMemo(() => {
    const map = new Map<
      string,
      {
        volatility: number;
        b40Pct: number;
        n40Pct: number;
        t20Pct: number;
        totalUsers: number;
        avgSpendPerUser: number;
        avgTaxValue: number;
        topCategory: string;
        topCategoryPct: number;
      }
    >();

    for (const r of scopedRegions) {
      const state = r.state;
      const regionUsers = USERS.filter((u) => u.region === state);
      const txns = userTransactions.filter((t) => t.region === state);
      const amounts = txns.map((t) => t.amount);
      const totalAmount = amounts.reduce((s, v) => s + v, 0);
      const mean = amounts.length ? totalAmount / amounts.length : 0;
      const variance =
        amounts.length > 0
          ? amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length
          : 0;
      const volatility = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;

      const totalUsers = regionUsers.length;
      const b40 = regionUsers.filter((u) => u.incomeGroup === "B40").length;
      const n40 = regionUsers.filter((u) => u.incomeGroup === "M40").length;
      const t20 = regionUsers.filter((u) => u.incomeGroup === "T20").length;

      const catTotals = new Map<string, number>();
      for (const t of txns) catTotals.set(t.category, (catTotals.get(t.category) ?? 0) + t.amount);
      let topCategory = "-";
      let topCategoryValue = 0;
      for (const [cat, value] of catTotals.entries()) {
        if (value > topCategoryValue) {
          topCategory = cat;
          topCategoryValue = value;
        }
      }

      map.set(state, {
        volatility,
        b40Pct: totalUsers ? (b40 / totalUsers) * 100 : 0,
        n40Pct: totalUsers ? (n40 / totalUsers) * 100 : 0,
        t20Pct: totalUsers ? (t20 / totalUsers) * 100 : 0,
        totalUsers,
        avgSpendPerUser: totalUsers ? totalAmount / totalUsers : 0,
        avgTaxValue: txns.length ? totalAmount / txns.length : 0,
        topCategory,
        topCategoryPct: totalAmount > 0 ? (topCategoryValue / totalAmount) * 100 : 0,
      });
    }
    return map;
  }, [scopedRegions, userTransactions]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Top 5 Regions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">By transaction volume</p>
      </div>
      <div className="p-4 space-y-3">
        {ranked.map((r, i) => {
          const active = selectedRegion === r.state;
          const insight = insights.get(r.state);
          return (
            <button
              key={r.state}
              onClick={() => onSelectRegion(active ? null : r.state)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                active
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-border hover:bg-secondary"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{r.state}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                        r.growth >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {r.growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(r.growth).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full heat-gradient"
                        style={{ width: `${(r.spend / max) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] tabular-nums text-muted-foreground w-14 text-right">
                      RM {r.spend.toFixed(0)}M
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground tabular-nums">
                    <span>{r.transactions.toLocaleString()} txns</span>
                    <span>Vol Index <span className="text-foreground font-medium">{r.volumeIndex}</span></span>
                  </div>
                  {active && insight && (
                    <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px]">
                      <span className="text-muted-foreground">Volatility</span>
                      <span className="text-right font-medium text-foreground tabular-nums">
                        {insight.volatility.toFixed(1)}%
                      </span>
                      <span className="text-muted-foreground">B40</span>
                      <span className="text-right font-medium text-foreground tabular-nums">
                        {insight.b40Pct.toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground">N40</span>
                      <span className="text-right font-medium text-foreground tabular-nums">
                        {insight.n40Pct.toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground">T20</span>
                      <span className="text-right font-medium text-foreground tabular-nums">
                        {insight.t20Pct.toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground">Total Users</span>
                      <span className="text-right font-medium text-foreground tabular-nums">
                        {insight.totalUsers.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">Avg spend/User</span>
                      <span className="text-right font-medium text-foreground tabular-nums">
                        RM {insight.avgSpendPerUser.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">Top category</span>
                      <span className="text-right font-medium text-foreground">
                        {`${insight.topCategory} ${insight.topCategoryPct.toFixed(1)}%`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};



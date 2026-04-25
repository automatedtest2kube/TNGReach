import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ALL_CATEGORIES, type Category } from "@/admin-original/data/regions";
import { suggestUsers, type UserProfile } from "@/admin-original/data/users";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  user: UserProfile | null;
  filterCategories: Category[];
  userQuery: string;
  onUserQueryChange: (q: string) => void;
  onUserCommit: (q: string) => void;
  onUserClear: () => void;
}

export const UserRadarChart = ({
  user,
  filterCategories,
  userQuery,
  onUserQueryChange,
  onUserCommit,
  onUserClear,
}: Props) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const suggestions = suggestUsers(userQuery, 5);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-card">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">User Spending Profile</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Select a user to view radar</p>
        </div>
        <div className="p-4 space-y-2">
          <div ref={wrapRef} className="relative">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              IC Number
            </label>
            <div className="relative mt-1.5">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={userQuery}
                onChange={(e) => {
                  onUserQueryChange(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUserCommit(userQuery);
                    setOpen(false);
                  } else if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                placeholder="Search by IC Number"
                className="w-full rounded-md border border-input bg-background pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {userQuery && (
                <button
                  onClick={() => {
                    onUserClear();
                    setOpen(false);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Clear user"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {open && suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-elevated overflow-hidden animate-fade-in">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onUserCommit(s.ic);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center justify-between"
                  >
                    <span className="font-medium text-foreground tabular-nums">{s.ic}</span>
                    <span className="text-[10px] text-muted-foreground">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
            {userQuery && suggestions.length === 0 && (
              <div className="mt-1.5 text-[11px] text-destructive">No matching user found</div>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
          No user selected. Search by IC above to inspect category distribution.
        </div>
      </div>
    );
  }

  const cats = filterCategories.length ? filterCategories : ALL_CATEGORIES;
  const data = cats.map((c) => ({
    category: c,
    score: user.spendingByCategory[c] ?? 0,
  }));

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{user.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{user.region}</span>
            <button
              onClick={onUserClear}
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Clear selected user"
              title="Clear selected user"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {user.ic}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Category spending profile</p>
      </div>
      <div className="p-2 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => `${v}%`}
              axisLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, "Spending"]}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
                background: "#f3f4f6",
              }}
            />
            <Radar
              name={user.name}
              dataKey="score"
              stroke="hsl(var(--accent))"
              fill="hsl(var(--accent))"
              fillOpacity={0.35}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="px-5 pb-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {data.map((d) => (
            <div key={d.category} className="flex items-center justify-between">
              <span className="text-muted-foreground">{d.category}</span>
              <span className="font-medium text-foreground tabular-nums">{d.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


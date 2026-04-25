import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
}

export const KpiCard = ({ label, value, delta, icon: Icon }: Props) => {
  const positive = delta >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</div>
      <div
        className={`mt-1 inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
          positive ? "text-success" : "text-destructive"
        }`}
      >
        {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(delta).toFixed(1)}% vs last period
      </div>
    </div>
  );
};


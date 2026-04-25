interface Props {
  total: number;
  current: number;
}
export function ProgressDots({ total, current }: Props) {
  const pct = (current / (total - 1)) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-brand-purple/15">
        <div
          className="animate-gradient absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,var(--brand-blue),var(--brand-purple),var(--brand-orange),var(--brand-purple),var(--brand-blue))] bg-[length:200%_100%] transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums text-brand-purple/80">
        {current + 1}/{total}
      </span>
    </div>
  );
}

interface Props {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: Props) {
  return (
    <header className="sticky top-16 z-30 border-b border-[color:color-mix(in_oklab,var(--color-brand-purple)_14%,transparent)] bg-[linear-gradient(180deg,oklch(0.985_0.012_280/0.94)_0%,oklch(0.98_0.02_280/0.72)_100%)] backdrop-blur-md">
      <div className="mx-auto max-w-md px-5 py-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-purple">TNG Reach</p>
        <h1 className="mt-0.5 text-xl font-bold leading-tight tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}

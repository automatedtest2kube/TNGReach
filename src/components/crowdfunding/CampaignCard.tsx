import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Flame, Headphones, Heart, Pause, Sparkles, Users } from "lucide-react";
import type { Campaign, Category } from "@/lib/crowdfunding/mock-data";
import { donorStore, useDonorStore } from "@/lib/crowdfunding/donor-store";
import { cn } from "@/lib/utils";

/** Urgency: warm ramp so High reads clearly on photos. */
const URGENCY_STYLE: Record<string, string> = {
  High: "bg-gradient-to-r from-rose-600 to-orange-500 text-white shadow-sm ring-1 ring-white/25",
  Medium: "bg-amber-400/95 text-amber-950 ring-1 ring-amber-300/60",
  Low: "bg-emerald-600/90 text-white ring-1 ring-emerald-300/50",
};

/** Category: distinct tints (not both white) — pairs with TNG blue/purple app shell. */
const CATEGORY_STYLE: Record<Category, string> = {
  Medical: "bg-rose-100/95 text-rose-900 ring-1 ring-rose-300/50",
  Food: "bg-amber-100/95 text-amber-900 ring-1 ring-amber-300/50",
  Business: "bg-sky-100/95 text-sky-900 ring-1 ring-sky-300/50",
  Behavior: "bg-violet-200/90 text-violet-950 ring-1 ring-violet-300/50",
};

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { followed } = useDonorStore();
  const isFollowing = followed.has(campaign.id);
  const [playing, setPlaying] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [ripple, setRipple] = useState(false);
  const prevRaised = useRef(campaign.raised);
  const [animatedRaised, setAnimatedRaised] = useState(campaign.raised);

  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  const reached = campaign.raised >= campaign.goal;

  useEffect(() => {
    if (campaign.raised === prevRaised.current) return;
    const start = prevRaised.current;
    const end = campaign.raised;
    const duration = 700;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedRaised(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else prevRaised.current = end;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [campaign.raised]);

  const donate = (amount: number) => {
    donorStore.donate(campaign.id, amount);
    setFlash(`Your RM${amount} helped move this campaign forward ❤️`);
    setRipple(true);
    setTimeout(() => setRipple(false), 900);
    setTimeout(() => setFlash(null), 2600);
  };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card animate-fade-in">
      <div className="relative h-44 w-full overflow-hidden">
        <img
          src={campaign.image}
          alt={campaign.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
              URGENCY_STYLE[campaign.urgency] ?? URGENCY_STYLE["Medium"],
            )}
          >
            <Flame className="h-3 w-3 shrink-0" /> {campaign.urgency}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold",
              CATEGORY_STYLE[campaign.category],
            )}
          >
            {campaign.category}
          </span>
        </div>
        {campaign.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-trust/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        )}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="text-lg font-bold leading-tight drop-shadow">{campaign.name}</h3>
          <p className="mt-0.5 text-xs opacity-95 line-clamp-2">{campaign.description}</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* Progress */}
        <div>
          <div className="flex items-end justify-between text-sm">
            <p className="font-bold">
              RM{animatedRaised.toLocaleString()}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                of RM{campaign.goal.toLocaleString()}
              </span>
            </p>
            <p className="text-xs font-semibold text-primary">{pct}%</p>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full gradient-primary transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" /> {campaign.supporters} supporters
            </span>
            {pct >= 50 && !reached && (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <Sparkles className="h-3 w-3" /> 50% milestone
              </span>
            )}
            {reached && (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <Sparkles className="h-3 w-3" /> Goal reached!
              </span>
            )}
          </div>
        </div>

        {/* Donate buttons */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 5, 10].map((amt) => (
            <button
              key={amt}
              onClick={() => donate(amt)}
              className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
            >
              RM{amt}
              {ripple && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 animate-ripple" />
              )}
            </button>
          ))}
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => donorStore.toggleFollow(campaign.id)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
              isFollowing
                ? "bg-heart/10 text-heart"
                : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isFollowing && "fill-current")} />
            {isFollowing ? "Following" : "Follow Story"}
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all",
              playing
                ? "bg-trust/15 text-trust animate-pulse-soft"
                : "bg-secondary text-secondary-foreground hover:bg-accent",
            )}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
            {playing ? "Playing…" : "Listen Story"}
          </button>
        </div>

        {/* Story updates for followed */}
        {isFollowing && campaign.updates.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/40 p-3 animate-fade-in">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Story updates
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {campaign.updates.map((u, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <span className="font-semibold">{u.text}</span>
                    <span className="ml-1 text-muted-foreground">· {u.date}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {flash && (
          <div className="rounded-xl bg-success/10 px-3 py-2 text-xs font-semibold text-success animate-confetti">
            {flash}
          </div>
        )}
      </div>
    </article>
  );
}

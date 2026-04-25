import { useState } from "react";
import { BadgeCheck, MapPin, Sparkles, X } from "lucide-react";
import type { Campaign } from "@/lib/crowdfunding/mock-data";

interface Props {
  campaigns: Campaign[];
}

function statusFor(c: Campaign) {
  if (c.raised >= c.goal) return { label: "Goal Reached", tone: "bg-success/15 text-success" };
  if (c.raised / c.goal >= 0.5) return { label: "Funds Used", tone: "bg-trust/15 text-trust" };
  return { label: "In Progress", tone: "bg-warning/20 text-warning-foreground" };
}

export function DonationMap({ campaigns }: Props) {
  const [selected, setSelected] = useState<Campaign | null>(null);

  return (
    <div className="relative">
      {/* Stylized map */}
      <div className="relative mx-5 mt-4 h-[420px] overflow-hidden rounded-2xl border border-border/60 shadow-card">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.96 0.02 280)" />
              <stop offset="55%" stopColor="oklch(0.93 0.04 265)" />
              <stop offset="100%" stopColor="oklch(0.9 0.06 250)" />
            </linearGradient>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path
                d="M 8 0 L 0 0 0 8"
                fill="none"
                stroke="oklch(0.82 0.04 280)"
                strokeWidth="0.2"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#mapBg)" />
          <rect width="100" height="100" fill="url(#grid)" />
          {/* fake roads */}
          <path
            d="M0,30 Q30,40 60,25 T100,40"
            stroke="oklch(0.8 0.04 60)"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M0,70 Q40,60 70,75 T100,65"
            stroke="oklch(0.8 0.04 60)"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M50,0 Q55,40 45,60 T55,100"
            stroke="oklch(0.8 0.04 60)"
            strokeWidth="1.2"
            fill="none"
          />
          {/* fake water */}
          <ellipse cx="20" cy="85" rx="18" ry="8" fill="oklch(0.85 0.06 220)" opacity="0.55" />
        </svg>

        {/* Pins */}
        {campaigns.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c)}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${c.location.lng}%`, top: `${c.location.lat}%` }}
            aria-label={c.name}
          >
            <span className="relative flex flex-col items-center">
              <span className="pin-pulse flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-glow ring-2 ring-white/35">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="mt-1 rounded-md bg-card/95 px-1.5 py-0.5 text-[10px] font-semibold shadow-soft backdrop-blur">
                {c.location.place}
              </span>
            </span>
          </button>
        ))}

        {/* Summary chip */}
        <div className="absolute left-3 top-3 rounded-full border border-border/50 bg-card/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-soft backdrop-blur">
          You are currently helping <span className="font-bold text-brand-purple">{campaigns.length}</span>{" "}
          {campaigns.length === 1 ? "person" : "people"}
        </div>
      </div>

      {selected && <DetailSheet campaign={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function DetailSheet({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const status = statusFor(campaign);
  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-card shadow-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-40 w-full">
          <img src={campaign.image} alt={campaign.name} className="h-full w-full object-cover" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 backdrop-blur"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-3 flex gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${status.tone} backdrop-blur`}
            >
              {status.label}
            </span>
            {campaign.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-trust/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recipient
            </p>
            <h3 className="text-lg font-bold">{campaign.name}</h3>
            <p className="text-xs text-muted-foreground">{campaign.location.place}</p>
          </div>

          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              What the money is for
            </p>
            <p className="mt-1 text-sm">{campaign.cause}</p>
          </div>

          <div className="rounded-xl bg-primary/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Latest usage update
            </p>
            <p className="mt-1 text-sm font-medium">{campaign.usage}</p>
          </div>

          <div>
            <div className="flex items-end justify-between text-sm">
              <p className="font-bold">
                RM{campaign.raised.toLocaleString()}
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  of RM{campaign.goal.toLocaleString()}
                </span>
              </p>
              <p className="text-xs font-semibold text-primary inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {pct}%
              </p>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

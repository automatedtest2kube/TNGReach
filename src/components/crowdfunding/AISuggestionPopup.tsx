import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import type { Campaign } from "@/lib/crowdfunding/mock-data";
import { donorStore } from "@/lib/crowdfunding/donor-store";

interface Props {
  campaign: Campaign;
  onView: (id: string) => void;
}

export function AISuggestionPopup({ campaign, onView }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  const reason = `Only ${Math.round(((campaign.goal - campaign.raised) / campaign.goal) * 100)}% left to reach goal — your help today goes far.`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-20">
      <div className="pointer-events-auto mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card animate-slide-up">
        <div className="flex items-start gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-purple">
              AI Suggestion
            </p>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
              Donate to <span className="text-brand-purple">{campaign.name}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{reason}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-muted-foreground hover:bg-secondary"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <button
            onClick={() => {
              donorStore.donate(campaign.id, 5);
              setOpen(false);
            }}
            className="rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-2.5 text-sm font-bold text-white shadow-soft transition [touch-action:manipulation] active:scale-95"
          >
            Donate RM5
          </button>
          <button
            onClick={() => {
              onView(campaign.id);
              setOpen(false);
            }}
            className="rounded-xl border border-border/60 bg-white/90 py-2.5 text-sm font-semibold text-foreground backdrop-blur transition hover:border-brand-purple/30 hover:bg-brand-purple/5"
          >
            View Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  HandHeart,
  ImagePlus,
  LogOut,
  Mic,
  Plus,
  Send,
  Users,
  Volume2,
} from "lucide-react";
import {
  requestorStore,
  useRequestorStore,
  type RequestorCampaign,
} from "@/lib/crowdfunding/requestor-store";
import { speak, useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";

interface Props {
  onCreateNew: () => void;
}

export function RequestorDashboard({ onCreateNew }: Props) {
  const { campaigns, name } = useRequestorStore();
  const [activeId, setActiveId] = useState<string | null>(campaigns[0]?.id ?? null);

  const totals = useMemo(
    () => ({
      raised: campaigns.reduce((s, c) => s + c.raised, 0),
      supporters: campaigns.reduce((s, c) => s + c.supporters, 0),
    }),
    [campaigns],
  );

  const active = campaigns.find((c) => c.id === activeId) ?? campaigns[0];

  const speakSummary = () => {
    speak(
      `Hello ${name}. You have raised ringgit ${totals.raised}, from ${totals.supporters} kind people.`,
    );
  };

  return (
    <div className="px-5 pb-32 pt-2 animate-fade-in">
      {/* Big friendly hero */}
      <div className="card-gradient-glow card-sheen relative overflow-hidden rounded-3xl p-6 text-white shadow-glow">
        <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15 animate-blob" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold opacity-85">Hello,</p>
            <h2 className="text-2xl font-bold leading-tight">{name || "Friend"} 👋</h2>
          </div>
          <button
            onClick={() => requestorStore.logout()}
            className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>

        <div className="relative mt-5">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">
            People have given you
          </p>
          <p className="mt-1 text-5xl font-bold tracking-tight">
            RM{totals.raised.toLocaleString()}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold">
            <Users className="h-4 w-4" /> {totals.supporters} kind{" "}
            {totals.supporters === 1 ? "person" : "people"} helped you
          </p>
        </div>

        <button
          onClick={speakSummary}
          className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm font-bold backdrop-blur active:scale-95"
        >
          <Volume2 className="h-4 w-4" /> Read it to me
        </button>
      </div>

      {/* Big create button */}
      <button
        onClick={onCreateNew}
        className="mt-5 flex w-full items-center gap-4 rounded-3xl border-4 border-dashed border-primary/40 bg-primary/5 p-5 text-left active:scale-[0.99]"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-glow">
          <Plus className="h-7 w-7" />
        </span>
        <div>
          <p className="text-lg font-bold">Ask for help again</p>
          <p className="text-sm text-muted-foreground">We will guide you, step by step</p>
        </div>
      </button>

      {campaigns.length > 0 && (
        <>
          <h3 className="mt-7 text-base font-bold uppercase tracking-wider text-muted-foreground">
            Your stories
          </h3>

          {campaigns.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all",
                    active?.id === c.id
                      ? "bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-glow"
                      : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {c.title.split(/\s+/).slice(0, 4).join(" ") || "Untitled"}
                </button>
              ))}
            </div>
          )}

          {active && <CampaignDetail campaign={active} />}
        </>
      )}
    </div>
  );
}

function CampaignDetail({ campaign }: { campaign: RequestorCampaign }) {
  const [updateText, setUpdateText] = useState("");
  const pct = Math.min(100, Math.round((campaign.raised / campaign.goal) * 100));

  const updateVoice = useVoiceInput({
    lang: "en-MY",
    onFinal: (text) => setUpdateText((s) => (s ? s + " " + text : text)),
  });

  const postUpdate = () => {
    const t = updateText.trim();
    if (!t) return;
    requestorStore.addUpdate(campaign.id, t);
    setUpdateText("");
    speak("Update posted. Your supporters will see it.");
  };

  return (
    <article className="mt-3 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card animate-fade-in">
      <div className="relative h-40 w-full overflow-hidden bg-secondary">
        {campaign.image ? (
          <img src={campaign.image} alt={campaign.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold">
          {campaign.purpose}
        </span>
        {campaign.verification && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-trust/90 px-3 py-1 text-xs font-bold text-white">
            <BadgeCheck className="h-3.5 w-3.5" /> Verified
          </span>
        )}
        <h3 className="absolute bottom-3 left-3 right-3 text-lg font-bold leading-tight text-white drop-shadow">
          {campaign.title}
        </h3>
      </div>

      <div className="space-y-5 p-5">
        {/* Big progress */}
        <div>
          <p className="text-3xl font-bold">
            RM{campaign.raised.toLocaleString()}
            <span className="ml-2 text-base font-semibold text-muted-foreground">
              of RM{campaign.goal.toLocaleString()}
            </span>
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full gradient-primary transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-base">
            <span className="font-bold text-primary">{pct}%</span> of the way there ·
            <span className="ml-1 font-bold">{campaign.supporters}</span> supporters
          </p>
        </div>

        {/* Voice update */}
        <div className="rounded-2xl border-2 border-border/60 bg-muted/30 p-4">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Tell your supporters how it's going
          </p>
          <textarea
            value={
              updateText +
              (updateVoice.listening && updateVoice.transcript ? " " + updateVoice.transcript : "")
            }
            onChange={(e) => setUpdateText(e.target.value)}
            rows={2}
            placeholder='e.g. "Bought materials today"'
            className="mt-2 w-full resize-none rounded-xl border-2 border-input bg-background p-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-3 flex items-center gap-3">
            {updateVoice.supported && (
              <button
                onClick={updateVoice.listening ? updateVoice.stop : updateVoice.start}
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-glow [touch-action:manipulation] active:scale-95",
                  updateVoice.listening
                    ? "bg-heart animate-pulse-soft"
                    : "bg-gradient-to-br from-brand-blue to-brand-purple",
                )}
                aria-label="Speak update"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={postUpdate}
              disabled={!updateText.trim()}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition-all active:scale-[0.98]",
                updateText.trim()
                  ? "bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-glow"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <Send className="h-4 w-4" /> Post update
            </button>
          </div>
        </div>

        {/* Activity */}
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            What's happening
          </p>
          <ul className="mt-3 space-y-3">
            {campaign.updates.map((u, idx) => (
              <li key={u.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "h-3 w-3 rounded-full",
                      idx === 0
                        ? "bg-gradient-to-br from-brand-blue to-brand-purple animate-pulse-soft"
                        : "bg-primary/40",
                    )}
                  />
                  {idx < campaign.updates.length - 1 && (
                    <span className="h-full w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <p className="text-base font-semibold leading-snug">{u.text}</p>
                  <p className="text-xs text-muted-foreground">{u.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <HandHeart className="h-3.5 w-3.5" /> Posted {campaign.createdAt}
        </p>
      </div>
    </article>
  );
}

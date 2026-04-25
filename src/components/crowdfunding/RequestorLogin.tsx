import { useEffect } from "react";
import { HandHeart, Mic, Volume2 } from "lucide-react";
import { requestorStore } from "@/lib/crowdfunding/requestor-store";
import { speak, useVoiceInput } from "@/hooks/use-voice-input";

const GREETING = "Welcome. To begin, please tap the large purple button and say your name.";

export function RequestorLogin() {
  const voice = useVoiceInput({
    lang: "en-MY",
    onFinal: (text) => {
      // Take first 4 words as name
      const name = text.split(/\s+/).slice(0, 4).join(" ");
      if (name) requestorStore.login(name);
    },
  });

  useEffect(() => {
    const t = setTimeout(() => speak(GREETING, "en-MY"), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="px-5 pt-6 pb-8 animate-fade-in">
      {/* Greeting card */}
      <div className="card-gradient-glow card-sheen relative overflow-hidden rounded-3xl p-7 text-white shadow-glow">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 animate-blob" />
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">
            Hello 👋
            <br />
            Need a hand?
          </h2>
          <p className="mt-3 text-base opacity-95">
            We will help you, step by step. Just speak — no typing needed.
          </p>
          <button
            onClick={() => speak(GREETING)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-2 text-sm font-bold backdrop-blur active:scale-95"
          >
            <Volume2 className="h-4 w-4" /> Hear instructions
          </button>
        </div>
      </div>

      {/* Big voice button */}
      <div className="mt-8 text-center">
        <p className="text-lg font-semibold">Tap and say your name</p>
        <p className="mt-1 text-sm text-muted-foreground">Example: "My name is Aishah"</p>

        <button
          onClick={voice.listening ? voice.stop : voice.start}
          className={`relative mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-full text-white shadow-glow transition-all [touch-action:manipulation] active:scale-95 ${
            voice.listening
              ? "bg-heart animate-pulse-soft"
              : "bg-gradient-to-br from-brand-blue to-brand-purple"
          }`}
          aria-label="Speak your name"
        >
          {voice.listening && (
            <span className="absolute inset-0 rounded-full bg-heart/40 animate-ripple" />
          )}
          <Mic className="h-16 w-16" />
        </button>

        <p className="mt-5 text-base font-semibold text-foreground">
          {voice.listening ? "Listening… speak now" : "Tap the circle to speak"}
        </p>

        {voice.transcript && (
          <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-brand-purple/25 bg-brand-purple/5 px-4 py-3 text-base font-medium text-foreground animate-fade-in">
            "{voice.transcript}"
          </div>
        )}
      </div>

      {/* Manual fallback — only if voice unsupported */}
      {!voice.supported && <ManualNameFallback />}

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <HandHeart className="h-3.5 w-3.5" /> Safe and private. We do not share your story.
      </p>
    </div>
  );
}

function ManualNameFallback() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const name = String(fd.get("name") || "").trim();
        if (name) requestorStore.login(name);
      }}
      className="mt-6 space-y-3 rounded-2xl border border-border/60 bg-card p-5 shadow-card"
    >
      <label className="text-base font-semibold">Or type your name</label>
      <input
        name="name"
        placeholder="Your name"
        className="w-full rounded-xl border border-input bg-background px-4 py-4 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple py-4 text-lg font-bold text-white shadow-glow [touch-action:manipulation] active:scale-[0.98]"
      >
        Continue
      </button>
    </form>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Camera,
  Check,
  CreditCard,
  HandHeart,
  HeartPulse,
  ImagePlus,
  Mic,
  ScanFace,
  Square,
  Store,
  UtensilsCrossed,
  Volume2,
} from "lucide-react";
import { requestorStore, type RequestPurpose } from "@/lib/crowdfunding/requestor-store";
import { speak, useVoiceInput } from "@/hooks/use-voice-input";
import { cn } from "@/lib/utils";

const PURPOSES: {
  key: RequestPurpose;
  label: string;
  icon: typeof HeartPulse;
  tint: string;
  spoken: string[];
}[] = [
  {
    key: "Medical",
    label: "Medical",
    icon: HeartPulse,
    tint: "bg-heart/15 text-heart",
    spoken: ["medical", "hospital", "doctor", "sick", "medicine"],
  },
  {
    key: "Food",
    label: "Food",
    icon: UtensilsCrossed,
    tint: "bg-success/15 text-success",
    spoken: ["food", "rice", "meal", "eat", "hungry"],
  },
  {
    key: "Business",
    label: "Business",
    icon: Store,
    tint: "bg-trust/15 text-trust",
    spoken: ["business", "shop", "stall", "work", "job"],
  },
  {
    key: "Other",
    label: "Other",
    icon: Briefcase,
    tint: "bg-warning/20 text-warning-foreground",
    spoken: ["other", "something else"],
  },
];

const PRESET_AMOUNTS = [200, 500, 1000, 2000];

interface Props {
  onPosted: () => void;
  onCancel: () => void;
}

const STEP_PROMPTS = [
  "Step 1. What do you need help with? Tap the picture, or just say medical, food, or business.",
  "Step 2. How much money do you need? Tap a number, or say it out loud.",
  "Step 3. Tell us your story. Tap the big microphone and speak.",
  "Step 4. Now we will check it is really you. Please show your IC card, then your face.",
  "Last step. Look at your campaign, then tap Post.",
];

export function CreateCampaignFlow({ onPosted, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState<RequestPurpose | null>(null);
  const [goal, setGoal] = useState<number>(500);
  const [customGoal, setCustomGoal] = useState("");
  const [story, setStory] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // Verification (IC + Face)
  const [icScanned, setIcScanned] = useState(false);
  const [icScanning, setIcScanning] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const totalSteps = 5;

  // Speak the prompt for each step
  useEffect(() => {
    const t = setTimeout(() => speak(STEP_PROMPTS[step]), 400);
    return () => clearTimeout(t);
  }, [step]);

  // Voice input for story
  const storyVoice = useVoiceInput({
    lang: "en-MY",
    onFinal: (text) => setStory((s) => (s ? s + " " + text : text).trim()),
  });

  // Voice input for purpose
  const purposeVoice = useVoiceInput({
    lang: "en-MY",
    onFinal: (text) => {
      const lower = text.toLowerCase();
      const match = PURPOSES.find((p) => p.spoken.some((w) => lower.includes(w)));
      if (match) {
        setPurpose(match.key);
        speak(`You picked ${match.label}. Tap the big arrow to continue.`);
      }
    },
  });

  // Voice input for amount
  const amountVoice = useVoiceInput({
    lang: "en-MY",
    onFinal: (text) => {
      const digits = text.replace(/[^0-9]/g, "");
      if (digits) {
        const n = Math.max(50, parseInt(digits, 10));
        setCustomGoal(String(n));
        speak(`You said ringgit ${n}. Tap the big arrow to continue.`);
      }
    },
  });

  const finalGoal = customGoal ? Math.max(50, parseInt(customGoal, 10) || 0) : goal;

  const canNext = (() => {
    if (step === 0) return !!purpose;
    if (step === 1) return finalGoal >= 50;
    if (step === 2) return story.trim().length >= 5;
    if (step === 3) return icScanned && faceVerified;
    return true;
  })();

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const scanIC = () => {
    setIcScanning(true);
    speak("Hold your IC card steady.");
    setTimeout(() => {
      setIcScanning(false);
      setIcScanned(true);
      speak("IC card recognised. Now please tap to scan your face.");
    }, 2200);
  };

  const scanFace = () => {
    setFaceScanning(true);
    speak("Look at the camera and stay still.");
    setTimeout(() => {
      setFaceScanning(false);
      setFaceVerified(true);
      speak("Face matched. You are verified.");
    }, 2400);
  };

  const handlePost = () => {
    if (!purpose) return;
    // Auto-generate friendly title from story (elderly users skip this step)
    const title =
      story.split(/[.!?]/)[0].slice(0, 60).trim() || `Help ${purpose.toLowerCase()} request`;
    requestorStore.createCampaign({
      purpose,
      title,
      story: story.trim(),
      goal: finalGoal,
      image,
      verification: "ic_face",
    });
    speak("Your campaign is posted. People can help you now.");
    onPosted();
  };

  const goNext = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
    else handlePost();
  };

  const goBack = () => {
    if (step === 0) onCancel();
    else setStep((s) => s - 1);
  };

  return (
    <div className="px-5 pb-32 pt-2 animate-fade-in">
      {/* Big progress + back */}
      <div className="flex items-center gap-3">
        <button
          onClick={goBack}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-soft active:scale-95"
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Step {step + 1} of {totalSteps}
          </p>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full gradient-primary transition-[width] duration-500"
              style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => speak(STEP_PROMPTS[step])}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95"
          aria-label="Hear instructions"
        >
          <Volume2 className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6">
        {step === 0 && (
          <section className="space-y-5 animate-fade-in">
            <h2 className="text-3xl font-bold leading-tight">
              What do you
              <br />
              need help with?
            </h2>
            <p className="text-base text-muted-foreground">Tap the picture, or say it out loud.</p>

            <div className="grid grid-cols-2 gap-3">
              {PURPOSES.map(({ key, label, icon: Icon, tint }) => {
                const active = purpose === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setPurpose(key);
                      speak(`You picked ${label}.`);
                    }}
                    className={cn(
                      "flex aspect-square flex-col items-center justify-center gap-3 rounded-3xl border-4 p-4 transition-all active:scale-95",
                      active
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "border-border/60 bg-card",
                    )}
                  >
                    <span
                      className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", tint)}
                    >
                      <Icon className="h-9 w-9" />
                    </span>
                    <span className="text-lg font-bold">{label}</span>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                        <Check className="h-3.5 w-3.5" /> Picked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <BigVoiceButton
              listening={purposeVoice.listening}
              supported={purposeVoice.supported}
              transcript={purposeVoice.transcript}
              onPress={purposeVoice.listening ? purposeVoice.stop : purposeVoice.start}
              hint='Or say "Medical" or "Food"'
            />
          </section>
        )}

        {step === 1 && (
          <section className="space-y-5 animate-fade-in">
            <h2 className="text-3xl font-bold leading-tight">
              How much money
              <br />
              do you need?
            </h2>
            <p className="text-base text-muted-foreground">Tap one of the amounts.</p>

            <div className="grid grid-cols-2 gap-3">
              {PRESET_AMOUNTS.map((amt) => {
                const active = !customGoal && goal === amt;
                return (
                  <button
                    key={amt}
                    onClick={() => {
                      setCustomGoal("");
                      setGoal(amt);
                      speak(`Ringgit ${amt}`);
                    }}
                    className={cn(
                      "rounded-3xl border-4 py-7 text-2xl font-bold transition-all active:scale-95",
                      active
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-border/60 bg-card",
                    )}
                  >
                    RM{amt.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {customGoal && (
              <div className="rounded-2xl bg-primary/10 p-5 text-center animate-fade-in">
                <p className="text-sm font-semibold text-muted-foreground">You said</p>
                <p className="text-4xl font-bold text-primary">
                  RM{parseInt(customGoal, 10).toLocaleString()}
                </p>
              </div>
            )}

            <BigVoiceButton
              listening={amountVoice.listening}
              supported={amountVoice.supported}
              transcript={amountVoice.transcript}
              onPress={amountVoice.listening ? amountVoice.stop : amountVoice.start}
              hint='Or say "Five hundred"'
            />
          </section>
        )}

        {step === 2 && (
          <section className="space-y-5 animate-fade-in">
            <h2 className="text-3xl font-bold leading-tight">
              Tell us
              <br />
              your story
            </h2>
            <p className="text-base text-muted-foreground">Tap the big microphone and speak.</p>

            <button
              onClick={storyVoice.listening ? storyVoice.stop : storyVoice.start}
              className={cn(
                "relative mx-auto flex h-44 w-44 items-center justify-center rounded-full text-white shadow-glow [touch-action:manipulation] transition-all active:scale-95",
                storyVoice.listening
                  ? "bg-heart animate-pulse-soft"
                  : "bg-gradient-to-br from-brand-blue to-brand-purple",
              )}
            >
              {storyVoice.listening && (
                <span className="absolute inset-0 rounded-full bg-heart/40 animate-ripple" />
              )}
              {storyVoice.listening ? (
                <Square className="h-16 w-16 fill-current" />
              ) : (
                <Mic className="h-20 w-20" />
              )}
            </button>

            <p className="text-center text-lg font-semibold">
              {storyVoice.listening
                ? "Listening… tap red to stop"
                : story
                  ? "Tap to add more"
                  : "Tap to start speaking"}
            </p>

            {!storyVoice.supported && (
              <p className="text-center text-sm text-warning-foreground">
                Voice not available on this device — please type below.
              </p>
            )}

            <textarea
              value={
                story +
                (storyVoice.listening && storyVoice.transcript ? " " + storyVoice.transcript : "")
              }
              onChange={(e) => setStory(e.target.value)}
              rows={5}
              placeholder="Your story will appear here…"
              className="w-full resize-none rounded-2xl border-2 border-input bg-card p-4 text-lg leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            {/* Photo (optional, big button) */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              className="hidden"
            />
            {image ? (
              <div className="relative overflow-hidden rounded-2xl">
                <img src={image} alt="Your photo" className="h-48 w-full object-cover" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-background/95 px-4 py-2 text-sm font-bold backdrop-blur"
                >
                  <Camera className="h-4 w-4" /> Change photo
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-4 border-dashed border-border bg-card/70 text-muted-foreground active:scale-[0.99]"
              >
                <ImagePlus className="h-8 w-8" />
                <span className="text-base font-semibold">Add a photo (optional)</span>
              </button>
            )}
          </section>
        )}

        {step === 3 && (
          <section className="space-y-5 animate-fade-in">
            <h2 className="text-3xl font-bold leading-tight">
              Let's make sure
              <br />
              it's really you
            </h2>
            <p className="text-base text-muted-foreground">Two quick steps. Tap to begin.</p>

            {/* Step A — IC */}
            <VerifyCard
              number={1}
              title="Show your IC card"
              desc="Hold your MyKad in front of the camera"
              icon={CreditCard}
              done={icScanned}
              busy={icScanning}
              onTap={scanIC}
              busyLabel="Reading your IC…"
              doneLabel="IC card recognised"
            />

            {/* Step B — Face (only available after IC) */}
            <VerifyCard
              number={2}
              title="Scan your face"
              desc="Look straight at the camera"
              icon={ScanFace}
              done={faceVerified}
              busy={faceScanning}
              disabled={!icScanned}
              onTap={scanFace}
              busyLabel="Matching your face…"
              doneLabel="Face matched"
            />

            {icScanned && faceVerified && (
              <div className="rounded-2xl bg-success/10 p-4 text-center text-base font-bold text-success animate-confetti">
                ✅ You are verified. Tap continue.
              </div>
            )}
          </section>
        )}

        {step === 4 && purpose && (
          <section className="space-y-5 animate-fade-in">
            <h2 className="text-3xl font-bold leading-tight">
              Look at
              <br />
              your campaign
            </h2>
            <p className="text-base text-muted-foreground">Happy with it? Tap Post my story.</p>

            <article className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-card">
              <div className="relative h-48 w-full overflow-hidden bg-secondary">
                {image ? (
                  <img src={image} alt="Your campaign" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-foreground">
                  {purpose}
                </span>
                <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-trust/90 px-3 py-1 text-xs font-bold text-white">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-lg leading-relaxed">{story}</p>
                <p className="text-2xl font-bold">Need RM{finalGoal.toLocaleString()}</p>
              </div>
            </article>
          </section>
        )}
      </div>

      {/* Big sticky continue */}
      <div className="fixed bottom-24 left-0 right-0 z-30 px-5">
        <div className="mx-auto max-w-md">
          <button
            disabled={!canNext}
            onClick={goNext}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-xl font-bold shadow-glow transition-all active:scale-[0.98]",
              canNext
                ? "bg-gradient-to-r from-brand-blue to-brand-purple text-white"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            {step < totalSteps - 1 ? (
              <>
                Continue <ArrowRight className="h-6 w-6" />
              </>
            ) : (
              <>
                <HandHeart className="h-6 w-6" /> Post my story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BigVoiceButton({
  listening,
  supported,
  transcript,
  onPress,
  hint,
}: {
  listening: boolean;
  supported: boolean;
  transcript: string;
  onPress: () => void;
  hint: string;
}) {
  if (!supported) return null;
  return (
    <div className="rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center">
      <p className="text-sm font-semibold text-muted-foreground">{hint}</p>
      <button
        onClick={onPress}
        className={cn(
          "relative mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-full text-white shadow-glow [touch-action:manipulation] active:scale-95",
          listening
            ? "bg-heart animate-pulse-soft"
            : "bg-gradient-to-br from-brand-blue to-brand-purple",
        )}
      >
        {listening && <span className="absolute inset-0 rounded-full bg-heart/40 animate-ripple" />}
        <Mic className="h-9 w-9" />
      </button>
      {transcript && (
        <p className="mt-3 text-base font-semibold text-brand-purple">"{transcript}"</p>
      )}
    </div>
  );
}

function VerifyCard({
  number,
  title,
  desc,
  icon: Icon,
  done,
  busy,
  disabled,
  onTap,
  busyLabel,
  doneLabel,
}: {
  number: number;
  title: string;
  desc: string;
  icon: typeof CreditCard;
  done: boolean;
  busy: boolean;
  disabled?: boolean;
  onTap: () => void;
  busyLabel: string;
  doneLabel: string;
}) {
  return (
    <button
      onClick={onTap}
      disabled={disabled || busy || done}
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl border-4 p-5 text-left transition-all",
        done
          ? "border-success bg-success/5"
          : disabled
            ? "border-border/40 bg-muted/30 opacity-60"
            : "border-primary/40 bg-card active:scale-[0.98]",
      )}
    >
      <span
        className={cn(
          "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold",
          done ? "bg-success text-success-foreground" : "bg-primary/10 text-primary",
        )}
      >
        {done ? <Check className="h-7 w-7" /> : number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg font-bold">{title}</p>
        <p className="text-sm text-muted-foreground">
          {busy ? busyLabel : done ? doneLabel : desc}
        </p>
        {busy && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-1/2 gradient-primary animate-pulse-soft" />
          </div>
        )}
      </div>
      <Icon className={cn("h-8 w-8 shrink-0", done ? "text-success" : "text-primary")} />
    </button>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Mascot, type MascotPose, type MascotMood } from "./Mascot";
import { SpeechBubble } from "./SpeechBubble";
import { ProgressDots } from "./ProgressDots";
import { CameraCapture } from "./CameraCapture";
import logo from "@/assets/tng-reach-logo.png";
import { signIn, signUp } from "@/lib/api/auth";

type Lang = "en" | "bm" | "zh";
type AccountType = "normal" | "simple";
type IdType = "ic" | "passport";
export type RegistrationCompletePayload = {
  skipped: boolean;
  userId?: number;
};

const LANGS: { id: Lang; label: string; native: string; flag: string }[] = [
  { id: "en", label: "English", native: "English", flag: "🇬🇧" },
  { id: "bm", label: "Bahasa Melayu", native: "Bahasa Melayu", flag: "🇲🇾" },
  { id: "zh", label: "Chinese", native: "中文", flag: "🇨🇳" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/55">
      {children}
    </span>
  );
}

export function RegistrationFlow({
  onComplete,
}: {
  onComplete?: (payload: RegistrationCompletePayload) => void;
}) {
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Lang | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [idType, setIdType] = useState<IdType>("ic");
  const [icImage, setIcImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [icNo, setIcNo] = useState("880123-14-5678");
  const [fullName, setFullName] = useState("Nurul Aisyah binti Rahman");
  const [address, setAddress] = useState(
    "12, Jalan Bunga Raya, Taman Melati,\n53100 Kuala Lumpur, Malaysia",
  );
  const [authMode, setAuthMode] = useState<"none" | "signin" | "signup">("none");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const TOTAL = 6;
  const next = async () => {
    if (step === 0 && authMode !== "none") {
      setAuthError(null);
      if (!authEmail.trim() || !authPassword.trim()) {
        setAuthError("Email and password are required.");
        return;
      }
      if (authMode === "signup") {
        if (!fullName.trim()) {
          setAuthError("Full name is required.");
          return;
        }
        if (authPassword !== authConfirmPassword) {
          setAuthError("Passwords do not match.");
          return;
        }
      }
      try {
        setAuthLoading(true);
        const result =
          authMode === "signin"
            ? await signIn({ email: authEmail.trim(), password: authPassword })
            : await signUp({
                fullName: fullName.trim(),
                email: authEmail.trim(),
                password: authPassword,
              });
        onComplete?.({ skipped: false, userId: result.userId });
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Authentication failed.");
      } finally {
        setAuthLoading(false);
      }
      return;
    }
    if (step === TOTAL - 1) {
      onComplete?.({ skipped: false });
      return;
    }
    setStep((s) => Math.min(s + 1, TOTAL - 1));
  };
  const skip = () => onComplete?.({ skipped: true, userId: 1 });
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const stepConfig: {
    pose: MascotPose;
    mood: MascotMood;
    bubble: string;
  }[] = [
    { pose: "happy", mood: "wave", bubble: "Hi there! Let's get you started with TNG Reach!" },
    { pose: "wink", mood: "wink", bubble: "Pick your language — choose what feels like home." },
    { pose: "love", mood: "idle", bubble: "How would you like to use the app?" },
    { pose: "shield", mood: "idle", bubble: "Let's verify your ID — keep it inside the frame." },
    {
      pose: "shield",
      mood: "idle",
      bubble: "Please double-check your details — tap to edit if needed.",
    },
    {
      pose: "gift",
      mood: "celebrate",
      bubble: "Now a quick selfie to confirm it's really you! 💜",
    },
  ];

  const cfg = stepConfig[step];

  const ctaDisabled =
    authLoading ||
    (step === 0 && authMode === "signin" && (!authEmail.trim() || !authPassword.trim())) ||
    (step === 0 &&
      authMode === "signup" &&
      (!fullName.trim() ||
        !authEmail.trim() ||
        !authPassword.trim() ||
        !authConfirmPassword.trim() ||
        authPassword !== authConfirmPassword)) ||
    (step === 1 && !lang) ||
    (step === 2 && !accountType) ||
    (step === 3 && !icImage) ||
    (step === 4 && (!icNo.trim() || !fullName.trim() || !address.trim())) ||
    (step === 5 && !selfieImage);

  const ctaLabel = [
    authMode === "signin" ? "Sign in" : authMode === "signup" ? "Create account" : "Let's go",
    "Continue",
    "Continue",
    icImage ? "Looks good" : "Capture ID first",
    "Confirm details",
    selfieImage ? "Finish setup" : "Take selfie first",
  ][step];

  return (
    <div className="relative flex h-full flex-col">
      {/* Soft mesh background */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(at_20%_10%,oklch(0.92_0.08_265/0.7),transparent_55%),radial-gradient(at_85%_15%,oklch(0.9_0.1_60/0.45),transparent_50%),radial-gradient(at_50%_95%,oklch(0.88_0.1_300/0.55),transparent_55%)]"
      />
      <div
        className="animate-blob pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand-blue/30 blur-3xl"
        aria-hidden
      />
      <div
        className="animate-blob pointer-events-none absolute -right-12 top-40 h-48 w-48 rounded-full bg-brand-orange/25 blur-3xl"
        style={{ animationDelay: "-4s" }}
        aria-hidden
      />
      <div
        className="animate-blob pointer-events-none absolute bottom-20 left-1/3 h-52 w-52 rounded-full bg-brand-purple/25 blur-3xl"
        style={{ animationDelay: "-8s" }}
        aria-hidden
      />

      {/* header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <button
          onClick={back}
          disabled={step === 0}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/60 bg-white/60 text-brand-purple shadow-[0_6px_16px_-8px_rgba(120,80,220,0.3)] backdrop-blur-md transition hover:bg-white disabled:opacity-0"
          aria-label="Back"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/50 px-3 py-1 shadow-sm backdrop-blur-md">
          <img src={logo} alt="TNG Reach" className="h-6 w-6 object-contain" />
          <span className="text-[11px] font-bold tracking-wide text-brand-purple">TNG Reach</span>
        </div>
        <ProgressDots total={TOTAL} current={step} />
      </div>

      {/* mascot + bubble */}
      {step === 4 ? (
        <div className="relative z-10 mt-2 flex items-center gap-3 px-5">
          <div className="shrink-0">
            <Mascot pose={cfg.pose} mood={cfg.mood} size={88} />
          </div>
          <SpeechBubble text={cfg.bubble} className="flex-1" />
        </div>
      ) : (
        <div className="relative z-10 mt-2 flex flex-col items-center px-6">
          <Mascot pose={cfg.pose} mood={cfg.mood} size={150} />
          <SpeechBubble text={cfg.bubble} className="-mt-2" />
        </div>
      )}

      {/* dynamic content card */}
      <div className="scrollbar-hide relative z-10 mt-3 min-h-0 flex-1 overflow-y-auto px-5">
        <div
          className={`rounded-3xl border border-white/70 bg-white/55 p-5 shadow-[0_20px_50px_-25px_rgba(80,40,170,0.4)] backdrop-blur-xl ${accountType === "simple" ? "text-lg" : ""}`}
        >
          {step === 0 && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <span className="badge-welcome max-w-full">
                <Sparkles
                  className="h-3.5 w-3.5 shrink-0 text-brand-orange"
                  strokeWidth={2.5}
                  aria-hidden
                />
                Welcome aboard
              </span>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 28, delay: 0.08 }}
                className="px-1"
              >
                <h1 className="text-reach-hero text-center text-3xl font-extrabold leading-[1.1] tracking-tight">
                  Reach further,
                  <br />
                  together
                </h1>
              </motion.div>
              <p className="max-w-xs text-[13px] leading-relaxed text-foreground/65">
                Your friendly wallet for sending, saving and shopping — all in one cute place.
              </p>
              <div className="mt-1 flex items-center gap-4 text-[11px] font-semibold text-foreground/60">
                <span className="flex items-center gap-1">⚡ Instant</span>
                <span className="h-1 w-1 rounded-full bg-foreground/30" />
                <span className="flex items-center gap-1">🔒 Secure</span>
                <span className="h-1 w-1 rounded-full bg-foreground/30" />
                <span className="flex items-center gap-1">🎁 Rewards</span>
              </div>
              {authMode !== "none" && (
                <div className="mt-3 w-full rounded-2xl border border-brand-purple/20 bg-white/70 p-3 text-left">
                  <div className="mb-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode("signin")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${authMode === "signin" ? "bg-brand-purple text-white" : "bg-white text-brand-purple"}`}
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode("signup")}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${authMode === "signup" ? "bg-brand-purple text-white" : "bg-white text-brand-purple"}`}
                    >
                      Sign up
                    </button>
                  </div>
                  {authMode === "signup" && (
                    <div className="mb-2">
                      <FieldLabel>Full name</FieldLabel>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm"
                        placeholder="Full name"
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <FieldLabel>Email</FieldLabel>
                    <input
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm"
                      placeholder="you@email.com"
                      type="email"
                    />
                  </div>
                  <div className="mb-2">
                    <FieldLabel>Password</FieldLabel>
                    <input
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm"
                      placeholder="At least 8 characters"
                      type="password"
                    />
                  </div>
                  {authMode === "signup" && (
                    <div className="mb-2">
                      <FieldLabel>Confirm password</FieldLabel>
                      <input
                        value={authConfirmPassword}
                        onChange={(e) => setAuthConfirmPassword(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-sm"
                        placeholder="Re-enter password"
                        type="password"
                      />
                    </div>
                  )}
                  {authError && (
                    <p className="mt-1 text-xs font-medium text-red-600">{authError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Language */}
          {step === 1 && (
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-brand-purple/70">
                Choose your language
              </label>
              <div className="space-y-2">
                {LANGS.map((l, i) => {
                  const active = lang === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id)}
                      style={{ animationDelay: `${i * 60}ms` }}
                      className={`group animate-pop flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all duration-300 ${
                        active
                          ? "scale-[1.01] border-brand-purple bg-white shadow-[0_15px_30px_-10px_rgba(120,80,220,0.4)] ring-4 ring-brand-purple/30"
                          : "border-white/70 bg-white/70 hover:border-brand-purple/40 hover:bg-white"
                      }`}
                    >
                      <span className="text-2xl">{l.flag}</span>
                      <div className="flex-1">
                        <div className="text-[14px] font-bold text-foreground">{l.native}</div>
                        <div className="text-[11px] text-foreground/55">{l.label}</div>
                      </div>
                      {active && (
                        <span className="animate-pop flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-[11px] text-white shadow-md">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Account Type */}
          {step === 2 && (
            <div className="space-y-2.5">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-brand-purple/70">
                Account type
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: "normal" as const,
                    emoji: "✨",
                    title: "Normal",
                    desc: "Full features, sleek design, all the goodies.",
                    tint: "from-brand-blue/25 to-brand-purple/15",
                  },
                  {
                    id: "simple" as const,
                    emoji: "👴👵",
                    title: "Simple Mode",
                    desc: "Bigger text, larger buttons, easier to read.",
                    tint: "from-brand-orange/30 to-brand-purple/15",
                  },
                ].map((t, i) => {
                  const active = accountType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setAccountType(t.id)}
                      style={{ animationDelay: `${i * 80}ms` }}
                      className={`group animate-pop relative flex items-start gap-3 overflow-hidden rounded-2xl border-2 bg-gradient-to-br p-4 text-left transition-all duration-300 ${t.tint} ${
                        active
                          ? "scale-[1.01] border-brand-purple bg-white shadow-[0_15px_30px_-10px_rgba(120,80,220,0.5)] ring-4 ring-brand-purple/30"
                          : "border-white/70 bg-white/70 hover:border-brand-purple/40"
                      }`}
                    >
                      <span className="text-3xl">{t.emoji}</span>
                      <div className="flex-1">
                        <div className="text-[15px] font-bold text-foreground">{t.title}</div>
                        <div className="text-[12px] leading-snug text-foreground/60">{t.desc}</div>
                      </div>
                      {active && (
                        <span className="animate-pop flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-[11px] text-white shadow-md">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: IC / Passport scan */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-[0.15em] text-brand-purple/70">
                  Verify your identity
                </label>
                <div className="flex gap-1 rounded-full border border-white/70 bg-white/70 p-0.5 text-[11px] font-bold">
                  {(["ic", "passport"] as IdType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setIdType(t);
                        setIcImage(null);
                      }}
                      className={`rounded-full px-3 py-1 transition ${
                        idType === t
                          ? "bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow"
                          : "text-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {t === "ic" ? "IC" : "Passport"}
                    </button>
                  ))}
                </div>
              </div>

              <CameraCapture
                facingMode="environment"
                shape="rect"
                aspect="1.6 / 1"
                captured={icImage}
                onCapture={setIcImage}
                onRetake={() => setIcImage(null)}
                hint={`Place ${idType === "ic" ? "IC" : "passport"} inside the frame`}
              />

              <p className="flex items-center gap-1.5 px-1 text-[11px] text-foreground/55">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-blue" />
                Your ID stays encrypted on your device.
              </p>
            </div>
          )}

          {/* Step 4: Verify extracted details */}
          {step === 4 && (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-brand-purple/70">
                Verify your details
              </label>

              {icImage && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-2.5">
                  <img
                    src={icImage}
                    alt="Captured ID"
                    className="h-12 w-20 rounded-lg object-cover ring-1 ring-brand-purple/20"
                  />
                  <div className="flex-1">
                    <div className="text-[12px] font-bold text-foreground">Scan complete</div>
                    <div className="text-[11px] text-foreground/55">
                      Please confirm the info below
                    </div>
                  </div>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-purple text-[11px] text-white shadow-md">
                    ✓
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <FieldLabel>IC / Passport No.</FieldLabel>
                <input
                  value={icNo}
                  onChange={(e) => setIcNo(e.target.value)}
                  className="w-full rounded-xl border-2 border-white/70 bg-white/80 px-3 py-2.5 text-[14px] font-semibold text-foreground outline-none transition focus:border-brand-purple focus:bg-white focus:ring-4 focus:ring-brand-purple/20"
                  placeholder="e.g. 880123-14-5678"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Full name</FieldLabel>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border-2 border-white/70 bg-white/80 px-3 py-2.5 text-[14px] font-semibold text-foreground outline-none transition focus:border-brand-purple focus:bg-white focus:ring-4 focus:ring-brand-purple/20"
                  placeholder="As shown on your IC"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Address</FieldLabel>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-white/70 bg-white/80 px-3 py-2.5 text-[13px] font-medium leading-snug text-foreground outline-none transition focus:border-brand-purple focus:bg-white focus:ring-4 focus:ring-brand-purple/20"
                  placeholder="Residential address"
                />
              </div>

              <p className="flex items-center gap-1.5 px-1 text-[11px] text-foreground/55">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand-purple" />
                Tap any field to correct it before continuing.
              </p>
            </div>
          )}

          {/* Step 5: Selfie */}
          {step === 5 && (
            <div className="space-y-3">
              <label className="block text-[11px] font-bold uppercase tracking-[0.15em] text-brand-purple/70">
                Selfie verification
              </label>
              <CameraCapture
                facingMode="user"
                shape="circle"
                captured={selfieImage}
                onCapture={setSelfieImage}
                onRetake={() => setSelfieImage(null)}
                hint="Center your face"
              />
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 px-5 pb-5 pt-4">
        <button
          onClick={next}
          disabled={ctaDisabled}
          className="group relative w-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--brand-blue),var(--brand-purple)_45%,var(--brand-orange))] bg-[length:200%_auto] px-6 py-4 text-base font-bold text-white shadow-[0_15px_35px_-10px_rgba(120,80,220,0.7),inset_0_1px_0_0_rgba(255,255,255,0.4)] transition-transform duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none [animation:gradientShift_3s_ease_infinite,ringPulse_2s_ease-in-out_infinite] disabled:[animation:none]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {ctaLabel}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-bob"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] [animation:shimmer_2.5s_ease-in-out_infinite] group-disabled:hidden" />
        </button>
        {step === 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 text-[12px] text-foreground/55">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className="font-bold text-brand-purple underline-offset-2 hover:underline"
              >
                Sign in
              </button>
              {" · "}
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className="font-bold text-brand-purple underline-offset-2 hover:underline"
              >
                Sign up
              </button>
            </p>
            <button
              type="button"
              onClick={skip}
              className="rounded-full border border-brand-purple/20 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-brand-purple shadow-sm backdrop-blur-sm transition hover:bg-white"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

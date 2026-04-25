import { useEffect, useState } from "react";
import { RegistrationFlow } from "@/components/RegistrationFlow";
import type { RegistrationCompletePayload } from "@/components/RegistrationFlow";
import { SplashScreen } from "@/components/onboarding/SplashScreen";
import { HomeScreen } from "@/components/screens/home-screen";
import { SendMoneyScreen } from "@/components/screens/send-money-screen";
import { ScanPayScreen } from "@/components/screens/scan-pay-screen";
import { BillsScreen } from "@/components/screens/bills-screen";
import { HistoryScreen } from "@/components/screens/history-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { ParkingScreen } from "@/components/screens/parking-screen";
import { AIInsightsScreen } from "@/components/screens/ai-insights-screen";
import { AIVoiceScreen } from "@/components/screens/ai-voice-screen";
import { RemindersScreen } from "@/components/screens/reminders-screen";
import { TrustScoreScreen } from "@/components/screens/trust-score-screen";
import { FamilyScreen } from "@/components/screens/family-screen";
import { BottomNav } from "@/components/screens/bottom-nav";
import { AIChatHead } from "@/components/ai/ai-chat-head";
import { AICommandCenter } from "@/components/ai/ai-command-center";
import { CrowdfundingHubScreen } from "@/components/screens/crowdfunding-hub-screen";
import { Bell, Settings } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useAccessibility } from "@/context/accessibility-context";
import { FALLBACK_USER_PROFILE, fetchUserProfile } from "@/lib/user-profile";
import { useBackendHealth } from "@/hooks/use-backend-health";
import { DEMO_USER_ID } from "@/lib/api/wallet";

type Phase = "splash" | "registration" | "main";

export function IntegratedWalletApp() {
  const [phase, setPhase] = useState<Phase>("splash");
  const [currentScreen, setCurrentScreen] = useState("home");
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [profile, setProfile] = useState(FALLBACK_USER_PROFILE);
  const [activeUserId, setActiveUserId] = useState<number>(DEMO_USER_ID);
  const { isElderlyMode, chatBubbleEnabled } = useAccessibility();
  const { loading: backendLoading, data: backendHealth, error: backendError } = useBackendHealth();

  useEffect(() => {
    const raw = window.localStorage.getItem("tngreach.activeUserId");
    if (!raw) {
      return;
    }
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) {
      setActiveUserId(id);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tngreach.activeUserId", String(activeUserId));
  }, [activeUserId]);

  useEffect(() => {
    const timer = setTimeout(() => setPhase("registration"), 3200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== "main" || currentScreen !== "home") {
      setHeaderVisible(true);
      return;
    }
    const handleScroll = () => setHeaderVisible(window.scrollY < 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [phase, currentScreen]);

  useEffect(() => {
    let alive = true;
    fetchUserProfile()
      .then((data) => {
        if (alive) setProfile(data);
      })
      .catch(() => {
        // Keep fallback values when mock/API is unavailable.
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleRegistrationComplete = (payload: RegistrationCompletePayload) => {
    if (payload.userId) {
      setActiveUserId(payload.userId);
    } else if (payload.skipped) {
      setActiveUserId(DEMO_USER_ID);
    }
    setPhase("main");
  };

  if (phase === "splash") return <SplashScreen />;
  if (phase === "registration") return <RegistrationFlow onComplete={handleRegistrationComplete} />;

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen === "crowdfunding" ? "community-support" : screen);
    window.scrollTo(0, 0);
  };
  const handleBack = () => handleNavigate("home");
  const showBottomNav = ["home", "history", "ai-insights", "profile"].includes(currentScreen);
  const showHeader = currentScreen === "home";
  const showChatBubble = chatBubbleEnabled && !isAIOpen && (!showHeader || !headerVisible);
  const backendIsUp = Boolean(backendHealth?.ok && backendHealth?.db === "ok");
  const backendLabel = backendIsUp
    ? "Backend live"
    : backendLoading
      ? "Checking backend..."
      : backendError
        ? "Backend offline"
        : "Backend not ready";

  return (
    <div className="wallet-theme relative isolate mx-auto flex min-h-screen max-w-lg flex-col overflow-hidden bg-[linear-gradient(100deg,oklch(0.985_0.012_280)_0%,oklch(0.95_0.04_280)_50%,oklch(0.96_0.045_300)_100%)] pt-[max(env(safe-area-inset-top),0.5rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[radial-gradient(at_20%_8%,oklch(0.92_0.08_265/0.5),transparent_55%),radial-gradient(at_88%_12%,oklch(0.9_0.1_60/0.35),transparent_50%),radial-gradient(at_50%_92%,oklch(0.88_0.1_300/0.4),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 h-56 w-56 -left-16 top-8 animate-blob rounded-full bg-brand-blue/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 h-48 w-48 -right-10 top-36 animate-blob rounded-full bg-brand-orange/25 blur-3xl [animation-delay:-4s]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 bottom-24 left-1/3 h-52 w-52 animate-blob rounded-full bg-brand-purple/25 blur-3xl [animation-delay:-8s]"
      />
      {showHeader && !isElderlyMode && (
        <header className="sticky top-0 z-30 flex items-center justify-between bg-[linear-gradient(180deg,oklch(0.985_0.012_280/0.92)_0%,oklch(0.98_0.02_280/0.55)_55%,transparent_100%)] px-5 pb-2 pt-4 backdrop-blur-md">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
            style={{ background: "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)" }}
          >
            SA
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {profile.accountMode === "simple" && (
              <span className="mr-1 rounded-full border border-brand-orange/35 bg-brand-orange/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-orange">
                Simple Mode
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsAIOpen(true)}
              className="relative -m-1.5 flex min-h-[3.5rem] min-w-[3.5rem] touch-manipulation items-center justify-center rounded-2xl p-1.5 active:scale-95 active:bg-brand-purple/12 [touch-action:manipulation]"
              style={{ WebkitTapHighlightColor: "transparent" }}
              aria-label="Open AI assistant"
            >
              <Mascot
                pose="happy"
                mood="idle"
                followPointer={false}
                className="pointer-events-none [&>div[aria-hidden]]:hidden [filter:drop-shadow(0_2px_8px_rgba(60,40,120,0.15))]"
                size={48}
              />
              <span
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #F85149 0%, #FF6B6B 100%)",
                  boxShadow: "0 2px 8px rgba(248, 81, 73, 0.45)",
                }}
                aria-hidden
              >
                1
              </span>
            </button>
            <button
              onClick={() => handleNavigate("reminders")}
              className="w-12 h-12 rounded-full icon-btn-glass flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#E6EDF3]" />
            </button>
            <button
              onClick={() => handleNavigate("profile")}
              className="w-12 h-12 rounded-full icon-btn-glass flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-[#E6EDF3]" />
            </button>
          </div>
        </header>
      )}
      {showHeader && (
        <div className="px-5 pb-2">
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
            style={{
              color: backendIsUp ? "#166534" : "#9A3412",
              background: backendIsUp ? "rgba(34,197,94,0.12)" : "rgba(251,146,60,0.15)",
              borderColor: backendIsUp ? "rgba(34,197,94,0.35)" : "rgba(251,146,60,0.35)",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: backendIsUp ? "#22C55E" : "#FB923C" }}
              aria-hidden
            />
            {backendLabel}
          </div>
        </div>
      )}
      {currentScreen === "home" && (
        <HomeScreen onNavigate={handleNavigate} activeUserId={activeUserId} />
      )}
      {currentScreen === "send" && <SendMoneyScreen onBack={handleBack} />}
      {currentScreen === "scan" && (
        <ScanPayScreen onBack={handleBack} onNavigate={handleNavigate} />
      )}
      {currentScreen === "family-scan" && (
        <ScanPayScreen onBack={() => handleNavigate("family")} onNavigate={handleNavigate} scanMode="family" />
      )}
      {currentScreen === "bills" && <BillsScreen onBack={handleBack} />}
      {currentScreen === "history" && (
        <HistoryScreen onBack={handleBack} activeUserId={activeUserId} />
      )}
      {currentScreen === "profile" && (
        <ProfileScreen onBack={handleBack} onNavigate={handleNavigate} />
      )}
      {currentScreen === "parking" && <ParkingScreen onBack={handleBack} />}
      {currentScreen === "ai-insights" && (
        <AIInsightsScreen onBack={handleBack} onNavigate={handleNavigate} />
      )}
      {currentScreen === "ai-voice" && (
        <AIVoiceScreen onBack={handleBack} onNavigate={handleNavigate} />
      )}
      {currentScreen === "reminders" && <RemindersScreen onBack={handleBack} />}
      {currentScreen === "community-support" && <CrowdfundingHubScreen onBack={handleBack} />}
      {currentScreen === "trust-score" && <TrustScoreScreen onBack={handleBack} />}
      {currentScreen === "family" && <FamilyScreen onBack={handleBack} onNavigate={handleNavigate} />}
      {showBottomNav && (
        <BottomNav
          activeScreen={currentScreen}
          onNavigate={handleNavigate}
          onOpenAI={() => setIsAIOpen(true)}
        />
      )}
      <AIChatHead onOpen={() => setIsAIOpen(true)} visible={showChatBubble} />
      <AICommandCenter
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
        onNavigate={(screen) => {
          setIsAIOpen(false);
          handleNavigate(screen);
        }}
      />
    </div>
  );
}

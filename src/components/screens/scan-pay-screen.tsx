"use client";

import { ArrowLeft, Flashlight, Image, Check, Store, FileText, ChevronLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAccessibility } from "@/context/accessibility-context";
import {
  addFamilyMember,
  extractInviteCodeFromQrValue,
  lookupFamilyInviteByCode,
} from "@/lib/family-link";

const pageBg = {
  background:
    "linear-gradient(100deg, oklch(0.95 0.04 270) 0%, oklch(0.94 0.045 285) 45%, oklch(0.95 0.05 70) 100%)",
} as const;

interface ScanPayScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  scanMode?: "payment" | "family";
}

type Step = "scan" | "detected" | "confirm" | "success";
type ScanTarget = "payment" | "family";

export function ScanPayScreen({ onBack, scanMode = "payment" }: ScanPayScreenProps) {
  const [step, setStep] = useState<Step>("scan");
  const [flashOn, setFlashOn] = useState(false);
  const [amount, setAmount] = useState("25.00");
  const [isLinkingFamily, setIsLinkingFamily] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [scanTarget, setScanTarget] = useState<ScanTarget>(scanMode);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanLoopRef = useRef<number | null>(null);
  const { isElderlyMode, t } = useAccessibility();
  const nativeBridgeAvailable =
    typeof window !== "undefined" && typeof window.ReactNativeWebView?.postMessage === "function";

  const merchant = {
    name: "Kedai Kopi Selemat",
    id: "MER-2024-88721",
    type: "Food & Beverage",
  };

  const autoLinkByInviteCode = async (codeRaw: string) => {
    const inviteCode = codeRaw.trim().toUpperCase();
    if (!inviteCode) return false;
    setIsLinkingFamily(true);
    try {
      const invite = await lookupFamilyInviteByCode(inviteCode);
      if (!invite) {
        window.alert("Invite code not found. Ask family member for a valid code.");
        return false;
      }
      addFamilyMember({
        name: invite.inviterName,
        phone: invite.inviterPhone,
        relation: "Family",
      });
      window.alert(`Family linked: ${invite.inviterName}`);
      return true;
    } finally {
      setIsLinkingFamily(false);
    }
  };

  const handleDetectedQr = async (rawValue: string) => {
    if (scanMode === "payment") {
      setStep("detected");
      return;
    }
    const inviteCodeFromQr = extractInviteCodeFromQrValue(rawValue);
    if (inviteCodeFromQr) {
      const linked = await autoLinkByInviteCode(inviteCodeFromQr);
      if (!linked) return;
      return;
    }
    if (scanMode === "family" || scanTarget === "family") {
      window.alert("This QR is not a family invite QR. Please scan the Family QR or enter invite code.");
      return;
    }
    // Fallback: treat non-family QR as normal payment QR.
    setStep("detected");
  };

  const handleUseInviteCode = () => {
    if (!inviteCodeInput.trim()) return;
    void autoLinkByInviteCode(inviteCodeInput);
  };

  const requestNativeQrScanner = () => {
    if (!nativeBridgeAvailable) return;
    const payload = {
      type: "OPEN_NATIVE_QR_SCANNER",
      payload: {},
    };
    window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
  };

  useEffect(() => {
    if (step !== "scan") return;
    if (nativeBridgeAvailable) {
      requestNativeQrScanner();
      return;
    }
    let cancelled = false;

    const stopScan = () => {
      if (scanLoopRef.current) {
        window.clearInterval(scanLoopRef.current);
        scanLoopRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraReady(false);
    };

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setScanError("Camera scanning is not supported on this device/browser.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play().catch(() => {});
        setCameraReady(true);
        setScanError(null);

        if (!("BarcodeDetector" in window)) {
          setScanError("QR detection is unavailable here. Use invite code below.");
          return;
        }
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        scanLoopRef.current = window.setInterval(async () => {
          if (!videoRef.current || isLinkingFamily) return;
          try {
            const results = await detector.detect(videoRef.current);
            const first = results[0]?.rawValue;
            if (first) {
              stopScan();
              void handleDetectedQr(first);
            }
          } catch {
            // Keep trying; transient detector errors can happen during warmup.
          }
        }, 350);
      } catch {
        setScanError("Unable to open camera. Please allow camera permission.");
      }
    };

    start();
    return () => {
      cancelled = true;
      stopScan();
    };
  }, [isLinkingFamily, nativeBridgeAvailable, step]);

  useEffect(() => {
    const onNativeQrResult = (event: Event) => {
      const custom = event as CustomEvent<{ rawValue?: string }>;
      const rawValue = custom.detail?.rawValue;
      if (typeof rawValue === "string" && rawValue.length > 0) {
          void handleDetectedQr(rawValue);
      }
    };
    const onNativeQrError = (event: Event) => {
      const custom = event as CustomEvent<{ error?: string }>;
      if (custom.detail?.error) {
        setScanError(custom.detail.error);
      }
    };
    window.addEventListener("native-qr-result", onNativeQrResult as EventListener);
    window.addEventListener("native-qr-error", onNativeQrError as EventListener);
    return () => {
      window.removeEventListener("native-qr-result", onNativeQrResult as EventListener);
      window.removeEventListener("native-qr-error", onNativeQrError as EventListener);
    };
  }, []);

  // Success Screen
  if (step === "success") {
    return (
      <motion.div
        className="flex min-h-screen flex-1 flex-col items-center justify-center px-6 pb-28"
        style={pageBg}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      >
        <motion.div
          className={`${isElderlyMode ? "h-28 w-28" : "h-24 w-24"} mb-6 flex items-center justify-center rounded-full shadow-glow`}
          style={{
            background: "linear-gradient(135deg, #3FB950 0%, #2EA043 100%)",
            boxShadow: "0 8px 40px rgba(63, 185, 80, 0.45)",
          }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.1 }}
        >
          <Check className={`${isElderlyMode ? "h-14 w-14" : "h-12 w-12"} text-white`} />
        </motion.div>
        <h2
          className={`mb-2 font-extrabold tracking-tight text-foreground ${isElderlyMode ? "text-3xl" : "text-2xl"}`}
        >
          {t("success")}!
        </h2>
        <p className={`mb-2 text-center text-foreground/55 ${isElderlyMode ? "text-lg" : ""}`}>
          RM {parseFloat(amount).toFixed(2)} paid to
        </p>
        <p className={`mb-8 font-semibold text-foreground ${isElderlyMode ? "text-xl" : ""}`}>
          {merchant.name}
        </p>
        <motion.button
          type="button"
          onClick={onBack}
          className={`btn-glow w-full max-w-xs rounded-2xl font-semibold text-white shadow-soft ${isElderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          whileTap={{ scale: 0.98 }}
        >
          {t("done")}
        </motion.button>
      </motion.div>
    );
  }

  // Payment Confirmation Screen
  if (step === "confirm") {
    return (
      <motion.div
        className="flex min-h-screen flex-1 flex-col px-5 pb-28"
        style={pageBg}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
      >
        <div className="mb-4 flex items-center gap-4 py-4">
          <motion.button
            type="button"
            onClick={() => setStep("detected")}
            className="icon-btn-glass flex h-12 w-12 items-center justify-center rounded-full text-foreground"
            whileTap={{ scale: 0.94 }}
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <h1
            className={`font-extrabold tracking-tight text-foreground ${isElderlyMode ? "text-2xl" : "text-xl"}`}
          >
            {t("confirm")} {t("payment")}
          </h1>
        </div>

        <div className="flex-1">
          <div className="flex flex-col items-center py-8">
            <motion.div
              className={`${isElderlyMode ? "h-24 w-24" : "h-20 w-20"} mb-4 flex items-center justify-center rounded-2xl shadow-soft ring-2 ring-white/35`}
              style={{
                background: "linear-gradient(135deg, #3FB950 0%, #2EA043 100%)",
                boxShadow: "0 8px 30px rgba(63, 185, 80, 0.35), inset 0 2px 0 rgba(255,255,255,0.2)",
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              <Store className={`${isElderlyMode ? "h-12 w-12" : "h-10 w-10"} text-white`} />
            </motion.div>
            <p className={`font-semibold text-foreground ${isElderlyMode ? "text-xl" : "text-lg"}`}>
              {merchant.name}
            </p>
            <p className={`text-foreground/50 ${isElderlyMode ? "text-base" : "text-sm"}`}>
              {merchant.type}
            </p>
          </div>

          <div className="mb-8 text-center">
            <p className={`mb-2 text-foreground/50 ${isElderlyMode ? "text-lg" : ""}`}>
              Amount to pay
            </p>
            <div className="flex items-center justify-center gap-1">
              <span
                className={`font-bold text-foreground ${isElderlyMode ? "text-4xl" : "text-3xl"}`}
              >
                RM
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className={`w-40 border-none bg-transparent text-center font-bold text-foreground outline-none ${isElderlyMode ? "text-6xl" : "text-5xl"}`}
              />
            </div>
          </div>

          <div className="card-glass rounded-2xl p-4 shadow-soft">
            <div
              className={`flex items-center justify-between py-3 ${isElderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-foreground/50">Payment Method</span>
              <span className="font-medium text-foreground">Wallet Balance</span>
            </div>
            <div
              className={`flex items-center justify-between border-t border-brand-purple/15 py-3 ${isElderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-foreground/50">Available Balance</span>
              <span className="font-medium text-[#3FB950]">RM 2,458.50</span>
            </div>
          </div>
        </div>

        <div className="py-4">
          <motion.button
            type="button"
            onClick={() => setStep("success")}
            disabled={!amount || parseFloat(amount) <= 0}
            className={`w-full rounded-2xl font-semibold text-white shadow-soft transition disabled:opacity-50 ${isElderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
            style={{
              background: "linear-gradient(135deg, #3FB950 0%, #2EA043 100%)",
              boxShadow: "0 4px 20px rgba(63, 185, 80, 0.4)",
            }}
            whileTap={!amount || parseFloat(amount) <= 0 ? undefined : { scale: 0.99 }}
          >
            Pay RM {parseFloat(amount || "0").toFixed(2)}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Bill Detection Result Screen
  if (step === "detected") {
    return (
      <motion.div
        className="flex min-h-screen flex-1 flex-col px-5 pb-28"
        style={pageBg}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
      >
        <div className="mb-4 flex items-center gap-4 py-4">
          <motion.button
            type="button"
            onClick={() => setStep("scan")}
            className="icon-btn-glass flex h-12 w-12 items-center justify-center rounded-full text-foreground"
            whileTap={{ scale: 0.94 }}
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>
          <h1
            className={`font-extrabold tracking-tight text-foreground ${isElderlyMode ? "text-2xl" : "text-xl"}`}
          >
            QR Detected
          </h1>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <motion.div
            className={`${isElderlyMode ? "h-24 w-24" : "h-20 w-20"} mb-6 flex items-center justify-center rounded-2xl border border-[#3FB950]/30`}
            style={{ background: "color-mix(in oklab, #3FB950 18%, white)" }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            <FileText
              className={`${isElderlyMode ? "h-12 w-12" : "h-10 w-10"} text-[#3FB950]`}
            />
          </motion.div>

          <div className="card-glass mb-6 w-full rounded-2xl p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl shadow-soft"
                style={{ background: "linear-gradient(135deg, #3FB950 0%, #2EA043 100%)" }}
              >
                <Store className="h-7 w-7 text-white" />
              </div>
              <div>
                <p
                  className={`font-semibold text-foreground ${isElderlyMode ? "text-xl" : "text-lg"}`}
                >
                  {merchant.name}
                </p>
                <p className={`text-foreground/50 ${isElderlyMode ? "text-base" : "text-sm"}`}>
                  {merchant.type}
                </p>
              </div>
            </div>
            <div className="border-t border-brand-purple/15 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-foreground/50">Merchant ID</span>
                <span className="font-mono text-sm text-foreground">{merchant.id}</span>
              </div>
            </div>
          </div>

          <p className={`text-center text-foreground/55 ${isElderlyMode ? "text-lg" : ""}`}>
            Merchant verified. Proceed to payment?
          </p>
        </div>

        <div className="py-4">
          <motion.button
            type="button"
            onClick={() => setStep("confirm")}
            className={`w-full rounded-2xl font-semibold text-white shadow-soft ${isElderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
            style={{
              background: "linear-gradient(135deg, #3FB950 0%, #2EA043 100%)",
              boxShadow: "0 4px 20px rgba(63, 185, 80, 0.4)",
            }}
            whileTap={{ scale: 0.99 }}
          >
            Proceed to Pay
          </motion.button>
          <motion.button
            type="button"
            onClick={() => setStep("scan")}
            className={`mt-3 h-12 w-full rounded-2xl font-medium text-foreground/50 transition active:bg-brand-purple/8 ${isElderlyMode ? "text-lg" : ""}`}
            whileTap={{ scale: 0.99 }}
          >
            Scan Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Camera Scan Screen — light page + dark viewfinder
  return (
    <div className="safe-top flex min-h-screen flex-1 flex-col pb-28" style={pageBg}>
      <motion.div
        className="flex items-center justify-between px-5 py-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
      >
        <motion.button
          type="button"
          onClick={onBack}
          className="icon-btn-glass flex h-12 w-12 items-center justify-center rounded-full text-foreground"
          whileTap={{ scale: 0.94 }}
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <h1
          className={`font-extrabold tracking-tight text-foreground ${isElderlyMode ? "text-2xl" : "text-xl"}`}
        >
          {scanMode === "family" ? "Family QR Scan" : t("scanPay")}
        </h1>
        <div className="w-12" />
      </motion.div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div
          className={`relative mb-8 ${isElderlyMode ? "h-72 w-72" : "h-64 w-64"} animate-breathe overflow-hidden rounded-[1.75rem] shadow-glow ring-2 ring-white/50`}
          style={{ background: "linear-gradient(180deg, #0d1117 0%, #1a222e 100%)" }}
        >
          {!nativeBridgeAvailable && (
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
          )}
          <div
            className="pointer-events-none absolute inset-2 rounded-[1.35rem] opacity-40"
            style={{
              boxShadow: "inset 0 0 40px color-mix(in oklab, var(--color-brand-purple) 35%, transparent)",
            }}
            aria-hidden
          />
          <div className="absolute inset-0 rounded-[1.75rem] border-2 border-white/10" />
          <div className="absolute top-0 left-0 h-12 w-12 rounded-tl-[1.75rem] border-t-4 border-l-4 border-[#3FB950]" />
          <div className="absolute top-0 right-0 h-12 w-12 rounded-tr-[1.75rem] border-t-4 border-r-4 border-[#3FB950]" />
          <div className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-[1.75rem] border-b-4 border-l-4 border-[#3FB950]" />
          <div className="absolute right-0 bottom-0 h-12 w-12 rounded-br-[1.75rem] border-b-4 border-r-4 border-[#3FB950]" />
          <motion.div
            className="absolute right-5 left-5 h-0.5 bg-[#3FB950]"
            style={{ boxShadow: "0 0 12px #3FB950" }}
            animate={{ top: ["12%", "88%", "12%"] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          {!cameraReady && !nativeBridgeAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs text-white/85">
              Starting camera...
            </div>
          )}
          {nativeBridgeAvailable && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs text-white/85">
              Opening native scanner...
            </div>
          )}
        </div>

        <p className={`mb-8 text-center text-foreground/55 ${isElderlyMode ? "text-lg" : ""}`}>
          Position the QR code within the frame to scan
        </p>
        {scanError && (
          <p className="mb-4 text-center text-xs font-medium text-destructive">{scanError}</p>
        )}

        <div className={`flex ${isElderlyMode ? "gap-12" : "gap-8"}`}>
          <motion.button
            type="button"
            onClick={() => setFlashOn(!flashOn)}
            className="flex flex-col items-center gap-2"
            whileTap={{ scale: 0.95 }}
          >
            <div
              className={`${isElderlyMode ? "h-16 w-16" : "h-14 w-14"} flex items-center justify-center rounded-full transition-all shadow-soft`}
              style={{
                background: flashOn
                  ? "linear-gradient(135deg, #D29922 0%, #F85149 100%)"
                  : "color-mix(in oklab, var(--color-foreground) 8%, white)",
                boxShadow: flashOn ? "0 4px 20px rgba(210, 153, 34, 0.35)" : undefined,
                border: flashOn ? undefined : "1px solid rgba(120, 80, 220, 0.12)",
              }}
            >
              <Flashlight
                className={`${isElderlyMode ? "h-8 w-8" : "h-6 w-6"} ${flashOn ? "text-white" : "text-foreground/70"}`}
              />
            </div>
            <span
              className={`${isElderlyMode ? "text-base" : "text-sm"} ${flashOn ? "font-semibold text-brand-orange" : "text-foreground/50"}`}
            >
              Flash
            </span>
          </motion.button>
          <motion.button type="button" className="flex flex-col items-center gap-2" whileTap={{ scale: 0.95 }}>
            <div
              className={`${isElderlyMode ? "h-16 w-16" : "h-14 w-14"} flex items-center justify-center rounded-full border border-brand-purple/15 bg-white/70 shadow-soft`}
            >
              <Image className={`${isElderlyMode ? "h-8 w-8" : "h-6 w-6"} text-foreground/70`} />
            </div>
            <span className={`${isElderlyMode ? "text-base" : "text-sm"} text-foreground/50`}>
              Gallery
            </span>
          </motion.button>
        </div>

        <motion.button
          type="button"
          onClick={() => setStep("detected")}
          className={`mt-8 rounded-full border-2 border-brand-purple/35 bg-white/85 px-6 py-3 font-semibold text-brand-purple shadow-soft backdrop-blur-sm ${isElderlyMode ? "text-lg" : "text-sm"}`}
          whileTap={{ scale: 0.98 }}
        >
          Simulate QR Scan
        </motion.button>
        {scanMode === "family" && (
          <div className="mt-3 w-full max-w-xs rounded-2xl border border-brand-purple/20 bg-white/85 p-3 shadow-soft">
            <p className="mb-2 text-center text-xs font-semibold text-foreground/60">Have invite code?</p>
            <div className="flex gap-2">
              <input
                value={inviteCodeInput}
                onChange={(e) => {
                  setScanTarget("family");
                  setInviteCodeInput(e.target.value.toUpperCase());
                }}
                placeholder="Enter code"
                className="w-full rounded-xl border border-brand-purple/25 px-3 py-2 text-center text-sm font-bold tracking-[0.08em] outline-none focus:border-brand-purple"
              />
              <button
                type="button"
                onClick={handleUseInviteCode}
                className="rounded-xl bg-brand-purple px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                disabled={isLinkingFamily}
              >
                {isLinkingFamily ? "Linking..." : "Link"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

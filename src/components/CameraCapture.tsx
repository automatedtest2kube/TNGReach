import { useEffect, useRef, useState } from "react";

interface Props {
  facingMode?: "user" | "environment";
  shape?: "rect" | "circle";
  aspect?: string; // e.g. "1.6 / 1" for IC, "1 / 1" for selfie
  onCapture: (dataUrl: string) => void;
  captured: string | null;
  onRetake: () => void;
  hint?: string;
  allowUpload?: boolean; // show "Upload from device" option
  overlay?: React.ReactNode;
}

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

/**
 * Live camera capture using getUserMedia. Works on mobile + desktop browsers.
 * Falls back to a friendly message if camera permission is denied or unsupported.
 */
export function CameraCapture({
  facingMode = "environment",
  shape = "rect",
  aspect = "1.6 / 1",
  onCapture,
  captured,
  onRetake,
  hint,
  allowUpload = false,
  overlay,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const usesNativeBridge =
    typeof window !== "undefined" && typeof window.ReactNativeWebView?.postMessage === "function";
  const MAX_IMAGE_DIMENSION = 1920;
  const CARD_GUIDE_FILL_RATIO = 0.86;

  const parseAspectRatio = (value: string) => {
    const normalized = value.replace(/\s+/g, "");
    if (normalized.includes("/")) {
      const [numRaw, denRaw] = normalized.split("/");
      const num = Number(numRaw);
      const den = Number(denRaw);
      if (Number.isFinite(num) && Number.isFinite(den) && num > 0 && den > 0) {
        return num / den;
      }
    }
    const numeric = Number(normalized);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    return 1.6;
  };

  const optimiseImageDataUrl = async (inputDataUrl: string) => {
    if (!inputDataUrl.startsWith("data:image/")) return inputDataUrl;

    try {
      const optimised = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const srcW = img.naturalWidth || img.width;
          const srcH = img.naturalHeight || img.height;
          const shouldGuideCrop = shape === "rect" && facingMode === "environment";
          const ratio = parseAspectRatio(aspect);

          let cropW = srcW;
          let cropH = srcH;
          let cropX = 0;
          let cropY = 0;

          if (shouldGuideCrop) {
            const widthByHeight = srcH * ratio;
            const heightByWidth = srcW / ratio;
            if (widthByHeight <= srcW) {
              cropW = widthByHeight;
              cropH = srcH;
            } else {
              cropW = srcW;
              cropH = heightByWidth;
            }

            cropW = Math.round(cropW * CARD_GUIDE_FILL_RATIO);
            cropH = Math.round(cropH * CARD_GUIDE_FILL_RATIO);
            cropX = Math.max(0, Math.round((srcW - cropW) / 2));
            cropY = Math.max(0, Math.round((srcH - cropH) / 2));
          }

          const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(cropW, cropH));
          const targetW = Math.max(1, Math.round(cropW * scale));
          const targetH = Math.max(1, Math.round(cropH * scale));

          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(inputDataUrl);
            return;
          }

          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
          const output = canvas.toDataURL("image/jpeg", 0.82);
          resolve(output.length < inputDataUrl.length ? output : inputDataUrl);
        };
        img.onerror = () => resolve(inputDataUrl);
        img.src = inputDataUrl;
      });

      return optimised;
    } catch {
      return inputDataUrl;
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (captured) {
      // stop stream when showing captured image
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
      return;
    }

    if (usesNativeBridge) {
      setError(null);
      setReady(true);
      const handleNativeResult = async (event: Event) => {
        const detail = (event as CustomEvent<{ dataUrl?: string }>).detail;
        if (typeof detail?.dataUrl === "string" && detail.dataUrl.length > 0) {
          const optimised = await optimiseImageDataUrl(detail.dataUrl);
          onCapture(optimised);
        }
      };
      const handleNativeError = (event: Event) => {
        const detail = (event as CustomEvent<{ error?: string }>).detail;
        setError(detail?.error ?? "Unable to capture photo on device.");
      };
      window.addEventListener("native-camera-result", handleNativeResult);
      window.addEventListener("native-camera-error", handleNativeError);
      return () => {
        window.removeEventListener("native-camera-result", handleNativeResult);
        window.removeEventListener("native-camera-error", handleNativeError);
      };
    }

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera not supported in this browser.");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        const msg =
          e instanceof Error && e.name === "NotAllowedError"
            ? "Camera permission denied. Please allow access in your browser."
            : "Couldn't open camera. Try another device or browser.";
        setError(msg);
      }
    };
    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [captured, facingMode, onCapture, usesNativeBridge]);

  const snap = async () => {
    if (usesNativeBridge) {
      setError(null);
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: "OPEN_NATIVE_CAMERA",
          payload: { facingMode },
        }),
      );
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror selfie horizontally so saved image matches the preview
    if (facingMode === "user") {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const optimised = await optimiseImageDataUrl(canvas.toDataURL("image/jpeg", 0.9));
    onCapture(optimised);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        const optimised = await optimiseImageDataUrl(result);
        onCapture(optimised);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isCircle = shape === "circle";
  const containerCls = isCircle
    ? "relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-inner ring-4 ring-white/60"
    : "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-inner";

  return (
    <div className="space-y-3">
      {/* IC scanning tips — shown above the viewfinder for rect/card scans only */}
      {!isCircle && !captured && facingMode === "environment" && (
        <div className="flex flex-col gap-0.5 rounded-xl bg-slate-800/90 px-3 py-2 text-[10px] leading-snug text-white/90">
          <span className="mb-0.5 font-semibold text-brand-blue">📋 For best results</span>
          <span>• Keep card flat — no tilt or rotation</span>
          <span>• Card should fill most of the frame</span>
          <span>• Ensure text is sharp and well-lit</span>
        </div>
      )}

      <div className={containerCls} style={!isCircle ? { aspectRatio: aspect } : undefined}>
        {captured ? (
          <img
            src={captured}
            alt="Captured"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-white/80">
            <div className="text-3xl">🚫</div>
            <div className="text-[11px] font-medium">{error}</div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              style={facingMode === "user" ? { transform: "scaleX(-1)" } : undefined}
            />
            {/* Overlay guides */}
            {isCircle ? (
              <>
                <div className="pointer-events-none absolute inset-4 rounded-full border-2 border-dashed border-brand-blue/70" />
                <div className="pointer-events-none absolute inset-4 rounded-full border-2 border-brand-blue animate-[ringPulse_2s_ease-in-out_infinite]" />
              </>
            ) : (
              <>
                <div className="pointer-events-none absolute inset-x-4 top-0 h-0.5 animate-[scanline_2s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-brand-blue to-transparent shadow-[0_0_10px_var(--brand-blue)]" />
                {(
                  [
                    "top-3 left-3 border-l-2 border-t-2",
                    "top-3 right-3 border-r-2 border-t-2",
                    "bottom-3 left-3 border-l-2 border-b-2",
                    "bottom-3 right-3 border-r-2 border-b-2",
                  ] as const
                ).map((c, i) => (
                  <div
                    key={i}
                    className={`pointer-events-none absolute h-6 w-6 rounded-sm border-brand-blue ${c}`}
                  />
                ))}
              </>
            )}
            {!ready && !error && (
              <div className="absolute inset-0 flex items-center justify-center text-white/70">
                <div className="text-[11px] font-medium">Starting camera…</div>
              </div>
            )}
            {hint && ready && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[11px] font-medium text-white/85">
                {hint}
              </div>
            )}
            {overlay && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3">{overlay}</div>
            )}
          </>
        )}
      </div>

      <button
        onClick={captured ? onRetake : snap}
        disabled={!captured && (!ready || !!error)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-purple/20 bg-white/80 py-2.5 text-[12px] font-bold text-brand-purple transition hover:bg-white disabled:opacity-50"
      >
        <span>{captured ? "🔄" : facingMode === "user" ? "📸" : "📷"}</span>
        {captured ? "Retake" : facingMode === "user" ? "Take selfie" : "Capture now"}
      </button>

      {allowUpload && !captured && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-purple/20 bg-white/60 py-2.5 text-[12px] font-bold text-brand-purple/80 transition hover:bg-white/80"
          >
            <span>📁</span>
            Upload from device
          </button>
        </>
      )}
    </div>
  );
}

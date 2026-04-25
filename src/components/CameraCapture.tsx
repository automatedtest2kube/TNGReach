import { type ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  facingMode?: "user" | "environment";
  shape?: "rect" | "circle";
  aspect?: string; // e.g. "1.6 / 1" for IC, "1 / 1" for selfie
  onCapture: (dataUrl: string) => void;
  captured: string | null;
  onRetake: () => void;
  hint?: string;
  overlay?: ReactNode;
}

type NativeCameraEvent = CustomEvent<{ dataUrl?: string; error?: string }>;

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
  overlay,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeRequestedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [useFileFallback, setUseFileFallback] = useState(false);
  const nativeBridgeAvailable =
    typeof window !== "undefined" && typeof window.ReactNativeWebView?.postMessage === "function";

  useEffect(() => {
    let cancelled = false;
    if (captured) {
      // stop stream when showing captured image
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
      return;
    }

    if (nativeBridgeAvailable) {
      // In app wrapper mode, always use native full-screen camera flow.
      setUseFileFallback(false);
      setReady(false);
      if (!nativeRequestedRef.current) {
        nativeRequestedRef.current = true;
        setError("Opening native camera...");
        requestNativeCamera();
      }
      return;
    }

    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setUseFileFallback(true);
          setError("Live camera is unavailable. Use camera upload below.");
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
            ? "Camera permission denied. Use camera upload below or allow access."
            : "Couldn't open camera. Try another device or browser.";
        setUseFileFallback(true);
        setError(msg);
      }
    };
    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode, captured, nativeBridgeAvailable]);

  useEffect(() => {
    const onNativeResult = (event: Event) => {
      const customEvent = event as NativeCameraEvent;
      const dataUrl = customEvent.detail?.dataUrl;
      if (typeof dataUrl === "string" && dataUrl.length > 0) {
        setError(null);
        onCapture(dataUrl);
      }
    };

    const onNativeError = (event: Event) => {
      const customEvent = event as NativeCameraEvent;
      setError(customEvent.detail?.error ?? "Unable to open native camera.");
    };

    window.addEventListener("native-camera-result", onNativeResult as EventListener);
    window.addEventListener("native-camera-error", onNativeError as EventListener);
    return () => {
      window.removeEventListener("native-camera-result", onNativeResult as EventListener);
      window.removeEventListener("native-camera-error", onNativeError as EventListener);
    };
  }, [onCapture]);

  const snap = () => {
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
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  };
  const pickFromFile = () => {
    const input = fileInputRef.current;
    if (!input) return;
    try {
      // Some engines support this and it is less likely to be blocked.
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Fall through to click below.
    }
    input.click();
  };

  const onFilePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        onCapture(result);
      }
    };
    reader.readAsDataURL(file);
    // allow selecting the same file/camera capture again
    event.target.value = "";
  };

  const requestNativeCamera = () => {
    if (!nativeBridgeAvailable) return;
    const payload = {
      type: "OPEN_NATIVE_CAMERA",
      payload: { facingMode },
    };
    window.ReactNativeWebView?.postMessage(JSON.stringify(payload));
  };

  const retakeCaptured = () => {
    onRetake();
    if (nativeBridgeAvailable) {
      nativeRequestedRef.current = true;
      setError("Opening native camera...");
      requestNativeCamera();
    }
  };

  useEffect(() => {
    if (captured) {
      nativeRequestedRef.current = false;
    }
  }, [captured]);

  const isCircle = shape === "circle";
  const containerCls = isCircle
    ? "relative mx-auto aspect-square w-full max-w-[240px] overflow-hidden rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-inner ring-4 ring-white/60"
    : "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-inner";

  return (
    <div className="space-y-3">
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
            {overlay && !captured && (
              <div className="pointer-events-none absolute inset-x-3 top-3 z-20">
                {overlay}
              </div>
            )}
          </>
        )}
      </div>

      {nativeBridgeAvailable && !captured && !ready && !!error ? (
        <div className="flex w-full items-center justify-center rounded-2xl border-2 border-brand-purple/20 bg-white/70 py-2.5 text-[11px] font-semibold text-brand-purple/80">
          Opening native camera...
        </div>
      ) : useFileFallback && !captured ? (
        <label className="relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-brand-purple/20 bg-white/80 py-2.5 text-[12px] font-bold text-brand-purple transition hover:bg-white">
          <span>📷</span>
          Open camera / gallery
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture={facingMode}
            onChange={onFilePicked}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      ) : (
        <button
          type="button"
          onClick={captured ? retakeCaptured : snap}
          disabled={!captured && !ready}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-brand-purple/20 bg-white/80 py-2.5 text-[12px] font-bold text-brand-purple transition hover:bg-white disabled:opacity-50"
        >
          <span>{captured ? "🔄" : facingMode === "user" ? "📸" : "📷"}</span>
          {captured ? "Retake" : facingMode === "user" ? "Take selfie" : "Capture now"}
        </button>
      )}
    </div>
  );
}

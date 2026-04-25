import { useCallback, useEffect, useRef, useState } from "react";

// Minimal types for Web Speech API (not in default DOM lib)
interface SRAlternative {
  transcript: string;
  confidence: number;
}
interface SRResult {
  isFinal: boolean;
  0: SRAlternative;
  length: number;
}
interface SREvent {
  resultIndex: number;
  results: { length: number; [i: number]: SRResult };
}
interface SR {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SRCtor = new () => SR;

interface VoiceWindow extends Window {
  SpeechRecognition?: SRCtor;
  webkitSpeechRecognition?: SRCtor;
}

export interface UseVoiceInputOptions {
  lang?: string; // e.g. "en-MY", "ms-MY", "zh-CN"
  onFinal?: (text: string) => void;
}

export function useVoiceInput({ lang = "en-US", onFinal }: UseVoiceInputOptions = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SR | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as VoiceWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (Ctor) setSupported(true);
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window as VoiceWindow;
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Voice input not supported on this device");
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      let finalText = "";
      let latest = "";
      rec.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript + " ";
          else interim += r[0].transcript;
        }
        latest = (finalText + interim).trim();
        setTranscript(latest);
      };
      rec.onerror = (e) => {
        setError(e.error || "Voice error");
      };
      rec.onend = () => {
        setListening(false);
        const t = (finalText.trim() || latest).trim();
        if (t) onFinalRef.current?.(t);
      };
      recRef.current = rec;
      setError(null);
      setTranscript("");
      rec.start();
      setListening(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice error");
    }
  }, [lang]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  useEffect(
    () => () => {
      recRef.current?.abort();
    },
    [],
  );

  return { supported, listening, transcript, error, start, stop, setTranscript };
}

export function speak(text: string, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {
    // ignore
  }
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Mic, Send, MicOff, Volume2 } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useAccessibility } from "@/context/accessibility-context";
import { fetchPollyAudio, sendChatMessage, transcribeAudio } from "@/lib/api/chat";

interface AICommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
  activeUserId?: number;
}

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
}

export function AICommandCenter({ isOpen, onClose, onNavigate, activeUserId }: AICommandCenterProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [panelHeight, setPanelHeight] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      text: "Hi Sarah! How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const { isElderlyMode, voiceEnabled, language } = useAccessibility();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const dragStartY = useRef(0);
  const startHeight = useRef(70);
  /** Ignore backdrop / close for a few ms so the post-touch synthetic click cannot reopen-close the sheet. */
  const suppressCloseUntilRef = useRef(0);

  const quickActions = [
    { label: "Send RM50 to Sarah", action: "send" },
    { label: "Top up RM100", action: "topup" },
    { label: "Pay electricity bill", action: "bills" },
    { label: "Scan QR code", action: "scan" },
    { label: "Check balance", action: "home" },
    { label: "View spending", action: "ai-insights" },
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const voiceLang = language === "bm" ? "ms-MY" : language === "zh" ? "zh-CN" : "en-US";

  useEffect(() => {
    if (isOpen) {
      setPanelHeight(70);
      suppressCloseUntilRef.current = Date.now() + 500;
    }
  }, [isOpen]);

  const tryClose = useCallback(() => {
    if (Date.now() < suppressCloseUntilRef.current) return;
    onClose();
  }, [onClose]);

  const playPolly = useCallback(async (text: string) => {
    try {
      const out = await fetchPollyAudio(text);
      const mime = out.contentType || "audio/mpeg";
      const audio = new Audio(`data:${mime};base64,${out.audioBase64}`);
      currentAudioRef.current?.pause();
      currentAudioRef.current = audio;
      await audio.play();
    } catch {
      // Keep chat flow resilient if Polly is not configured.
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    const userText = input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    try {
      const conversation = [...messages, userMessage].map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.text,
      })) as Array<{ role: "user" | "assistant"; content: string }>;
      const result = await sendChatMessage(conversation, activeUserId);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: result.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      if (voiceEnabled) {
        void playPolly(result.reply);
      }
      if (result.action === "pay_parking") {
        onNavigate?.("parking");
      } else if (result.action === "send_money") {
        onNavigate?.("send");
      }
    } catch {
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: "I cannot reach the AI service right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (onNavigate) {
      onClose();
      onNavigate(action);
    }
  };

  const toggleListening = () => {
    if (typeof window === "undefined" || !window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      return;
    }
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
          stream.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
          mediaRecorderRef.current = null;
          setIsListening(false);
          if (blob.size > 0) {
            void (async () => {
              try {
                setIsTranscribing(true);
                const buffer = await blob.arrayBuffer();
                let binary = "";
                const bytes = new Uint8Array(buffer);
                for (let i = 0; i < bytes.length; i++) {
                  binary += String.fromCharCode(bytes[i] ?? 0);
                }
                const base64 = btoa(binary);
                const transcript = await transcribeAudio(base64, blob.type || "audio/webm", voiceLang);
                setInput(transcript);
              } catch {
                setInput("");
              } finally {
                setIsTranscribing(false);
              }
            })();
          }
        };
        recorder.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    })();
  };
  useEffect(
    () => () => {
      currentAudioRef.current?.pause();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );


  const handleDragStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      setIsDragging(true);
      dragStartY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
      startHeight.current = panelHeight;
    },
    [panelHeight],
  );

  const handleDragMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;

      const currentY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const deltaY = dragStartY.current - currentY;
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      const newHeight = Math.min(95, Math.max(40, startHeight.current + deltaPercent));
      setPanelHeight(newHeight);
    },
    [isDragging],
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (panelHeight > 82) {
      setPanelHeight(95);
    } else if (panelHeight < 55) {
      setPanelHeight(40);
    } else {
      setPanelHeight(70);
    }
  }, [isDragging, panelHeight]);

  useEffect(() => {
    if (isDragging) {
      const onMove = (e: TouchEvent | MouseEvent) => handleDragMove(e);
      const onEnd = () => handleDragEnd();

      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onMove, { passive: true });
      window.addEventListener("touchend", onEnd);

      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onEnd);
        window.removeEventListener("touchmove", onMove);
        window.removeEventListener("touchend", onEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={tryClose} />

      {/* Command Center Panel */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50"
        style={{
          height: `${panelHeight}vh`,
          transition: isDragging ? "none" : "height 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="h-full max-w-lg mx-auto flex flex-col rounded-t-3xl overflow-hidden"
          style={{
            background:
              "linear-gradient(140deg, rgba(255,255,255,0.97) 0%, rgba(244,239,255,0.97) 55%, rgba(255,244,233,0.97) 100%)",
            border: "1px solid rgba(120, 80, 220, 0.2)",
            borderBottom: "none",
            boxShadow: "0 -12px 42px rgba(120, 80, 220, 0.22)",
          }}
        >
          {/* Drag Handle */}
          <div
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div
              className={`w-12 h-1.5 rounded-full transition-all duration-200 ${isDragging ? "bg-[#5896FD] w-20" : "bg-brand-purple/30 hover:bg-brand-purple/45"}`}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex shrink-0 items-center justify-center">
                <Mascot
                  pose="happy"
                  mood={isListening ? "celebrate" : "idle"}
                  followPointer={false}
                  className={`rounded-full [&>div[aria-hidden]]:hidden [filter:drop-shadow(0_2px_10px_rgba(60,40,120,0.18))] ${isListening ? "ring-2 ring-brand-purple/50 ring-offset-2 ring-offset-background" : ""}`}
                  size={isElderlyMode ? 56 : 48}
                />
              </div>
              <div>
                <h2 className={`font-bold text-brand-purple ${isElderlyMode ? "text-xl" : "text-lg"}`}>
                  AI Command Center
                </h2>
                <p className={`text-foreground/60 ${isElderlyMode ? "text-base" : "text-sm"}`}>
                  Ask anything. Act instantly.
                </p>
              </div>
            </div>
            <button
              onClick={tryClose}
              className={`${isElderlyMode ? "w-12 h-12" : "w-10 h-10"} rounded-full flex items-center justify-center transition-colors hover:bg-brand-purple/10`}
              style={{ background: "rgba(255, 255, 255, 0.88)", border: "1px solid rgba(120,80,220,0.18)" }}
            >
              <X className={`${isElderlyMode ? "w-6 h-6" : "w-5 h-5"} text-foreground/60`} />
            </button>
          </div>

          {/* Input Area - Fixed at top under header for easy access */}
          <div className="px-5 pb-4 shrink-0">
            <div
              className="flex items-center gap-2 p-2 rounded-2xl"
              style={{
                background: "rgba(33, 38, 45, 0.95)",
                border: "1px solid rgba(120, 80, 220, 0.25)",
                boxShadow: "0 8px 20px rgba(120, 80, 220, 0.15)",
                backgroundColor: "rgba(255,255,255,0.86)",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="e.g. Send RM50 to Sarah"
                className={`flex-1 bg-transparent px-4 py-2.5 text-foreground placeholder:text-foreground/45 focus:outline-none ${
                  isElderlyMode ? "text-lg" : "text-base"
                }`}
              />

              <button
                onClick={toggleListening}
                disabled={isTranscribing}
                className={`${isElderlyMode ? "w-11 h-11" : "w-10 h-10"} rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? "bg-[#F85149] animate-pulse"
                    : "bg-brand-purple/15 hover:bg-brand-purple/25"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Tap to record voice"
              >
                {isListening ? (
                  <MicOff className={`${isElderlyMode ? "w-5 h-5" : "w-4 h-4"} text-white`} />
                ) : (
                  <Mic className={`${isElderlyMode ? "w-5 h-5" : "w-4 h-4"} text-foreground/60`} />
                )}
              </button>

              <button
                onClick={handleSend}
                disabled={!input.trim() || isSending}
                className={`${isElderlyMode ? "w-11 h-11" : "w-10 h-10"} rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{
                  background: input.trim()
                    ? "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)"
                    : "rgba(120, 80, 220, 0.18)",
                  boxShadow: input.trim() ? "0 4px 15px rgba(88, 150, 253, 0.4)" : "none",
                }}
              >
                {isSending ? (
                  <span className="text-xs font-semibold text-white">...</span>
                ) : (
                  <Send className={`${isElderlyMode ? "w-5 h-5" : "w-4 h-4"} text-white`} />
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions - Wrapped in rows for easy tap */}
          <div className="px-5 pb-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.action)}
                  className={`px-4 py-2 rounded-full text-brand-blue transition-all hover:bg-brand-blue/20 hover:text-brand-purple active:scale-95 ${
                    isElderlyMode ? "text-base py-2.5 px-5" : "text-sm"
                  }`}
                  style={{
                    background: "rgba(255,255,255,0.82)",
                    border: "1px solid rgba(120, 80, 220, 0.18)",
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="px-5 shrink-0">
            <div className="h-px bg-gradient-to-r from-transparent via-brand-purple/30 to-transparent" />
          </div>

          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            <p className={`mb-3 text-foreground/45 ${isElderlyMode ? "text-sm" : "text-xs"}`}>
              Conversation
            </p>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      msg.type === "user"
                        ? "bg-gradient-to-r from-[#5896FD] to-[#806EF8] text-white rounded-br-md"
                        : "text-foreground rounded-bl-md"
                    } ${isElderlyMode ? "text-lg py-4" : "text-base"}`}
                    style={
                      msg.type === "ai"
                        ? {
                            background: "rgba(255,255,255,0.9)",
                            border: "1px solid rgba(120, 80, 220, 0.16)",
                          }
                        : undefined
                    }
                  >
                    <div>{msg.text}</div>
                    {msg.type === "ai" && (
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 rounded-full border border-brand-purple/25 px-2 py-1 text-xs text-brand-purple hover:bg-brand-purple/10"
                        onClick={() => void playPolly(msg.text)}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Read aloud
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowUpRight,
  BellRing,
  Check,
  ScanFace,
  X,
  Mic,
  Send,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useAccessibility } from "@/context/accessibility-context";
import { fetchPollyAudio, sendChatMessage, transcribeAudio, type ChatMessage } from "@/lib/api/chat";

interface AICommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
  currentScreen?: string;
  activeUserId?: number;
  userDisplayName?: string;
  onWalletChanged?: () => void;
}

type SendMoneyCard = {
  kind: "send_money";
  recipient: string;
  amount: number;
  phase: "preview" | "face_verifying" | "receipt";
  refNo?: string;
};

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
  pending?: boolean;
  card?: SendMoneyCard;
}

type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type SpeechRecognitionResultItem = { transcript: string };
type SpeechRecognitionResult = {
  isFinal: boolean;
  length: number;
  [idx: number]: SpeechRecognitionResultItem;
};
type SpeechRecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [idx: number]: SpeechRecognitionResult;
  };
};

function welcomeMessageText(userDisplayName?: string): string {
  const firstName = userDisplayName?.trim()?.split(/\s+/).filter(Boolean)[0] ?? "there";
  return `Hi ${firstName}! How can I help you today?`;
}

function messageToChatRole(type: Message["type"]): ChatMessage["role"] {
  return type === "ai" ? "assistant" : "user";
}

function parseAmountToken(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, "."));
}

/**
 * Normalizes user input for send-money intent matching (spacing + trailing punctuation).
 */
function normalizeSendMoneyInput(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.!?…]+$/u, "")
    .trim();
}

const AMOUNT = String.raw`(\d+(?:[.,]\d{1,2})?)`;
const CUR = String.raw`(?:rm|myr)`;

function cleanRecipient(raw: string): string {
  return raw
    .trim()
    .replace(/^(to|for)\s+/i, "")
    .replace(/[.,;:!?]+$/g, "")
    .trim();
}

/** Detects natural send phrases, e.g. "send money to ABU rm 50", "Send RM 100 To Tian Qi", "transfer 25.50 to Ali". */
export function parseSendMoneyIntent(raw: string): { recipient: string; amount: number } | null {
  const normalized = normalizeSendMoneyInput(raw);
  if (!normalized) return null;

  const patterns: Array<{ re: RegExp; recipient: number; amount: number }> = [
    // send money to <name> rm|myr <amount> (name may be multiple words)
    { re: new RegExp(`^send money to (.+?)\\s+${CUR}\\s*${AMOUNT}$`, "i"), recipient: 1, amount: 2 },
    // send money rm|myr <amount> to <name>
    { re: new RegExp(`^send money\\s+${CUR}\\s*${AMOUNT}\\s+to\\s+(.+)$`, "i"), recipient: 2, amount: 1 },
    // send|pay <currency><amount> to <name> — allows "RM100" or "RM 100"
    { re: new RegExp(`^(?:send|pay)\\s+${CUR}\\s*${AMOUNT}\\s+to\\s+(.+)$`, "i"), recipient: 2, amount: 1 },
    // send <amount> rm|myr to <name>
    { re: new RegExp(`^send\\s+${AMOUNT}\\s+${CUR}\\s+to\\s+(.+)$`, "i"), recipient: 2, amount: 1 },
    // transfer <currency><amount> to <name>
    { re: new RegExp(`^transfer\\s+${CUR}\\s*${AMOUNT}\\s+to\\s+(.+)$`, "i"), recipient: 2, amount: 1 },
    // transfer <amount> to <name> (currency optional / implied)
    { re: new RegExp(`^transfer\\s+${AMOUNT}\\s+to\\s+(.+)$`, "i"), recipient: 2, amount: 1 },
  ];

  for (const { re, recipient: ri, amount: ai } of patterns) {
    const m = re.exec(normalized);
    if (!m) continue;
    const recipientRaw = cleanRecipient(m[ri] ?? "");
    const amountRaw = m[ai]?.trim() ?? "";
    if (!recipientRaw || !amountRaw) continue;
    const amount = parseAmountToken(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    return { recipient: recipientRaw, amount };
  }

  // Fallback parser for freer wording, while preserving multi-word names.
  const amountMatch =
    /\b(?:rm|myr)\s*(\d+(?:[.,]\d{1,2})?)\b/i.exec(normalized) ??
    /\b(\d+(?:[.,]\d{1,2})?)\s*(?:rm|myr)\b/i.exec(normalized);
  const toMatch = /\bto\s+(.+)$/i.exec(normalized);
  if (amountMatch && toMatch) {
    const amount = parseAmountToken(amountMatch[1]);
    const recipient = cleanRecipient(toMatch[1] ?? "");
    if (Number.isFinite(amount) && amount > 0 && recipient) {
      return { recipient, amount };
    }
  }

  return null;
}

function isSendMoneyKeywordIntent(raw: string): boolean {
  const normalized = normalizeSendMoneyInput(raw).toLowerCase();
  return normalized === "pay" || normalized === "send" || normalized === "transfer";
}

function messageContentForApi(m: Message): string {
  if (m.type === "ai" && m.card?.kind === "send_money") {
    const { recipient, amount, phase, refNo } = m.card;
    if (phase === "receipt" && refNo) {
      return `[Send money completed: RM ${amount.toFixed(2)} to ${recipient}, ref ${refNo}]`;
    }
    if (phase === "face_verifying") {
      return `[Send money: face verification in progress for RM ${amount.toFixed(2)} to ${recipient}]`;
    }
    return `[Send money: RM ${amount.toFixed(2)} to ${recipient}, awaiting approval]`;
  }
  return m.text;
}

function makeSimulatedTxnRef(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `TXN${n}`;
}

function formatMessageTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function SendMoneyPreviewCard({
  recipient,
  amount,
  isElderlyMode,
  onApprove,
}: {
  recipient: string;
  amount: number;
  isElderlyMode: boolean;
  onApprove: () => void;
}) {
  const displayRecipient = recipient || "—";
  const amountWhole = Number.isFinite(amount) && amount % 1 === 0;
  const amountLabel = Number.isFinite(amount)
    ? amountWhole
      ? String(Math.round(amount))
      : amount.toFixed(2)
    : "0";

  return (
    <div className="w-full max-w-[320px] rounded-2xl border border-border/80 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5896FD] text-white">
          <ArrowUpRight className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-semibold uppercase tracking-wide text-muted-foreground ${isElderlyMode ? "text-xs" : "text-[10px]"}`}>
            Send money
          </p>
          <p className={`truncate font-semibold capitalize text-foreground ${isElderlyMode ? "text-lg" : "text-base"}`}>
            {displayRecipient}{" "}
            <span className="font-semibold lowercase text-muted-foreground">RM {amountLabel}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-full bg-slate-100 px-4 py-2 text-center">
        <span className={`font-bold text-[#5896FD] ${isElderlyMode ? "text-2xl" : "text-xl"}`}>
          <span className={`align-middle font-semibold ${isElderlyMode ? "text-lg" : "text-sm"}`}>RM</span>{" "}
          <span className="tabular-nums">{amountLabel}</span>
        </span>
      </div>

      <div className="mt-3 space-y-2 border-t border-border/60 pt-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Recipient</span>
          <span className="truncate font-medium capitalize text-foreground">
            {displayRecipient}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Status</span>
          <span className="font-semibold tabular-nums text-amber-600">Pending approval</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onApprove}
          className={`rounded-full bg-[#5896FD] px-5 py-2 font-semibold text-white shadow-md transition-opacity hover:opacity-95 ${
            isElderlyMode ? "text-base px-6 py-2.5" : "text-sm"
          }`}
        >
          Approve
        </button>
      </div>
    </div>
  );
}

function SendMoneyFaceVerifyCard({ isElderlyMode }: { isElderlyMode: boolean }) {
  return (
    <div className="relative w-full max-w-[320px] overflow-hidden rounded-2xl border border-border/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full border-2 border-emerald-400/40 animate-ping"
            style={{ animationDuration: "1.8s" }}
            aria-hidden
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/80">
            <ScanFace className={`${isElderlyMode ? "h-9 w-9" : "h-8 w-8"}`} aria-hidden />
          </div>
        </div>
        <p className={`mt-4 font-semibold text-foreground ${isElderlyMode ? "text-lg" : "text-base"}`}>
          Verifying your face
        </p>
        <p className={`mt-1 text-muted-foreground ${isElderlyMode ? "text-sm" : "text-xs"}`}>
          Hold still — simulated biometric check…
        </p>
      </div>
    </div>
  );
}

function SendMoneyReceiptCard({
  recipient,
  amount,
  refNo,
  isElderlyMode,
  onNotify,
}: {
  recipient: string;
  amount: number;
  refNo: string;
  isElderlyMode: boolean;
  onNotify: () => void;
}) {
  const displayRecipient = recipient || "—";
  const amountWhole = Number.isFinite(amount) && amount % 1 === 0;
  const amountLabel = Number.isFinite(amount)
    ? amountWhole
      ? String(Math.round(amount))
      : amount.toFixed(2)
    : "0";
  const subtitle = `Money sent to ${displayRecipient} RM ${amountLabel}`;

  return (
    <div className="w-full max-w-[320px] rounded-2xl border border-border/80 bg-white p-5 shadow-md">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className={`${isElderlyMode ? "h-8 w-8" : "h-7 w-7"} stroke-[2.5]`} aria-hidden />
        </div>
        <h3 className={`mt-3 font-bold text-foreground ${isElderlyMode ? "text-xl" : "text-lg"}`}>
          Transfer Successful!
        </h3>
        <p className={`mt-1 text-muted-foreground ${isElderlyMode ? "text-sm" : "text-xs"}`}>{subtitle}</p>
      </div>

      <div className="mt-4 space-y-0 divide-y divide-border/70 text-sm">
        <div className="flex items-center justify-between gap-2 py-2.5">
          <span className="text-muted-foreground">Recipient</span>
          <span className="truncate font-medium capitalize text-slate-900">
            {displayRecipient}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 py-2.5">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-bold text-emerald-600">
            RM <span className="tabular-nums">{amountLabel}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 py-2.5">
          <span className="text-muted-foreground">Ref no.</span>
          <span className="font-medium tabular-nums text-slate-900">{refNo}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={onNotify}
          className="flex min-w-0 max-w-[65%] items-center gap-2 text-left text-[#5896FD] transition-opacity hover:opacity-80"
        >
          <BellRing className="h-4 w-4 shrink-0" aria-hidden />
          <span className={`truncate font-medium ${isElderlyMode ? "text-sm" : "text-xs"}`}>
            Notify recipient
          </span>
        </button>
        <span
          className={`shrink-0 rounded-full bg-slate-200/95 px-3 py-1.5 font-medium text-slate-600 ${
            isElderlyMode ? "text-sm" : "text-xs"
          }`}
        >
          Sent
        </span>
      </div>
    </div>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function AICommandCenter({
  isOpen,
  onClose,
  onNavigate,
  currentScreen,
  activeUserId,
  userDisplayName,
  onWalletChanged,
}: AICommandCenterProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      text: welcomeMessageText(userDisplayName),
      timestamp: new Date(),
    },
  ]);
  const { isElderlyMode } = useAccessibility();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const speechRecognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSpokenAiIdRef = useRef<string | null>(null);
  const faceVerifyTimeoutsRef = useRef<Set<number>>(new Set());

  const quickActions = [
    { label: "Send RM50 to a contact", action: "send" },
    { label: "Top up RM100", action: "topup" },
    { label: "Pay electricity bill", action: "bills" },
    { label: "Pay parking", action: "parking" },
    { label: "Scan QR code", action: "scan" },
    { label: "Check balance", action: "home" },
    { label: "View spending", action: "ai-insights" },
  ];

  const screenLabelMap: Record<string, string> = {
    home: "Home",
    send: "Send Money",
    scan: "Scan & Pay",
    family: "Family",
    "family-scan": "Family Scan",
    bills: "Bills",
    history: "History",
    profile: "Profile & Settings",
    accessibility: "Accessibility",
    parking: "Parking",
    "ai-insights": "AI Insights",
    "ai-voice": "Voice Assistant",
    reminders: "Reminders",
    "community-support": "Community Support",
    "trust-score": "Trust Score",
  };
  const currentPageLabel = screenLabelMap[currentScreen ?? ""] ?? "this page";

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === "welcome" ? { ...m, text: welcomeMessageText(userDisplayName) } : m)),
    );
  }, [userDisplayName]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      faceVerifyTimeoutsRef.current.forEach((id) => clearTimeout(id));
      faceVerifyTimeoutsRef.current.clear();
    };
  }, []);

  const handleSend = async (
    overrideText?: string,
    opts?: { displayUserText?: string; replaceMessageId?: string; draftMessages?: Message[] },
  ) => {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    const userMessageId = opts?.replaceMessageId ?? Date.now().toString();
    const userMessage: Message = {
      id: userMessageId,
      type: "user",
      text: opts?.displayUserText ?? text,
      timestamp: new Date(),
      pending: false,
    };

    const baseMessages = opts?.draftMessages ?? messages;
    const replacedMessages = opts?.replaceMessageId
      ? baseMessages.map((m) => (m.id === opts.replaceMessageId ? userMessage : m))
      : baseMessages;
    const didReplace = Boolean(
      opts?.replaceMessageId && replacedMessages.some((m) => m.id === opts.replaceMessageId),
    );
    const nextMessages = didReplace ? replacedMessages : [...replacedMessages, userMessage];
    setMessages(nextMessages);
    if (!overrideText) {
      setInput("");
    }
    setIsSending(true);

    const sendMoneyPreview = parseSendMoneyIntent(text);
    const keywordIntent = isSendMoneyKeywordIntent(text);
    const sendMoneyCardPayload = sendMoneyPreview
      ? {
          recipient: sendMoneyPreview.recipient,
          amount: sendMoneyPreview.amount,
        }
      : keywordIntent
        ? {
            recipient: "Recipient",
            amount: 0,
          }
        : null;

    try {
      const payload: ChatMessage[] = nextMessages.map((m) => ({
        role: messageToChatRole(m.type),
        content: messageContentForApi(m),
      }));
      const res = await sendChatMessage(payload, activeUserId);
      const aiMsgId = `${Date.now()}-ai`;
      const replyText = sendMoneyCardPayload
        ? ""
        : (res.reply && String(res.reply).trim()) || "";

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          type: "ai",
          text: replyText,
          timestamp: new Date(),
          ...(sendMoneyCardPayload
            ? {
                card: {
                  kind: "send_money" as const,
                  recipient: sendMoneyCardPayload.recipient,
                  amount: sendMoneyCardPayload.amount,
                  phase: "preview" as const,
                },
              }
            : {}),
        },
      ]);
      if (res.action === "send_money" || res.action === "pay_parking") {
        onWalletChanged?.();
      }
      if (res.action === "pay_parking" && onNavigate) {
        onNavigate("parking");
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? `Sorry, I couldn't process that request (${error.message}).`
          : "Sorry, I couldn't process that request right now.";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          type: "ai",
          text: message,
          timestamp: new Date(),
        },
      ]);
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

  const handleApproveSendMoney = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId && m.card?.kind === "send_money" && m.card.phase === "preview"
          ? { ...m, card: { ...m.card, phase: "face_verifying" as const } }
          : m,
      ),
    );

    const tid = window.setTimeout(() => {
      faceVerifyTimeoutsRef.current.delete(tid);
      const refNo = makeSimulatedTxnRef();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId && m.card?.kind === "send_money" && m.card.phase === "face_verifying"
            ? { ...m, card: { ...m.card, phase: "receipt" as const, refNo } }
            : m,
        ),
      );
      onWalletChanged?.();
    }, 2400);
    faceVerifyTimeoutsRef.current.add(tid);
  };

  const handleReceiptNotify = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-notify`,
        type: "ai",
        text: "Recipient notification sent (demo).",
        timestamp: new Date(),
      },
    ]);
  };

  const playAiText = async (text: string) => {
    if (!text.trim()) return;
    setIsSpeaking(true);
    try {
      const { audioBase64, contentType } = await fetchPollyAudio(text);
      const src = `data:${contentType};base64,${audioBase64}`;
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = src;
      await audioRef.current.play();
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-tts`,
          type: "ai",
          text: "I couldn't play voice now, but the message is shown above.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSpeaking(false);
    }
  };

  const toggleVoice = () => {
    setIsVoiceOn((prev) => {
      const next = !prev;
      if (!next && audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isVoiceOn || isSpeaking) {
      return;
    }
    const latestAi = [...messages].reverse().find((m) => m.type === "ai" && !m.pending);
    if (!latestAi?.id || !latestAi.text) {
      return;
    }
    if (latestAi.id === "welcome") {
      return;
    }
    if (lastSpokenAiIdRef.current === latestAi.id) {
      return;
    }
    lastSpokenAiIdRef.current = latestAi.id;
    void playAiText(latestAi.text);
  }, [messages, isVoiceOn, isSpeaking]);

  const postTranscriptAsVoiceMessage = async (transcript: string, baseMessages: Message[]) => {
    const loadingMessageId = `${Date.now()}-voice-loading`;
    const loadingMessage: Message = {
      id: loadingMessageId,
      type: "user",
      text: "Voice message loading...",
      timestamp: new Date(),
      pending: true,
    };
    const withLoading = [...baseMessages, loadingMessage];
    setMessages(withLoading);
    await handleSend(transcript, {
      displayUserText: transcript,
      replaceMessageId: loadingMessageId,
      draftMessages: withLoading,
    });
  };

  const startAwsRecordingFallback = async (baseMessages: Message[]) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const chunks = recordedChunksRef.current;
          if (!chunks.length) return;
          setIsTranscribing(true);
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          const base64 = await blobToBase64(blob);
          const transcript = await transcribeAudio(base64, blob.type || "audio/webm");
          const next = transcript.trim();
          if (!next) return;
          await postTranscriptAsVoiceMessage(next, baseMessages);
        } catch {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-stt`,
              type: "ai",
              text: "I couldn't transcribe that audio. Please try again.",
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsTranscribing(false);
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      setIsListening(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-mic`,
          type: "ai",
          text: "Microphone access is blocked. Please allow mic permission.",
          timestamp: new Date(),
        },
      ]);
    }
  };

  const startListening = async () => {
    if (isListening || isTranscribing) return;
    const baseMessages = messages;

    const ctor = (
      window as Window & {
        SpeechRecognition?: BrowserSpeechRecognitionCtor;
        webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
      }
    ).SpeechRecognition ??
      (
        window as Window & {
          SpeechRecognition?: BrowserSpeechRecognitionCtor;
          webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
        }
      ).webkitSpeechRecognition;

    if (!ctor) {
      await startAwsRecordingFallback(baseMessages);
      return;
    }

    try {
      const recognition = new ctor();
      speechRecognitionRef.current = recognition;
      let finalTranscript = "";
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const chunk = result[0]?.transcript?.trim() ?? "";
          if (result.isFinal && chunk) {
            finalTranscript = finalTranscript ? `${finalTranscript} ${chunk}` : chunk;
          }
        }
      };
      recognition.onerror = async () => {
        speechRecognitionRef.current = null;
        setIsListening(false);
        await startAwsRecordingFallback(baseMessages);
      };
      recognition.onend = () => {
        setIsListening(false);
        speechRecognitionRef.current = null;
        const next = finalTranscript.trim();
        if (!next) {
          return;
        }
        void postTranscriptAsVoiceMessage(next, baseMessages);
      };
      recognition.start();
      setIsListening(true);
    } catch {
      await startAwsRecordingFallback(baseMessages);
    }
  };

  const stopListening = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }
    void startListening();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ height: "100vh" }}>
      <div
        className="h-full w-full flex flex-col overflow-hidden"
        style={{
          background:
            "linear-gradient(140deg, rgba(255,255,255,0.97) 0%, rgba(244,239,255,0.97) 55%, rgba(255,244,233,0.97) 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
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
                  Ask anything about {currentPageLabel}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={`${isElderlyMode ? "w-12 h-12" : "w-10 h-10"} rounded-full flex items-center justify-center transition-colors hover:bg-brand-purple/10 disabled:opacity-50`}
                style={{ background: "rgba(255, 255, 255, 0.88)", border: "1px solid rgba(120,80,220,0.18)" }}
                aria-label={isVoiceOn ? "Turn voice reading off" : "Turn voice reading on"}
              >
                {isVoiceOn ? (
                  <Volume2 className={`${isElderlyMode ? "w-6 h-6" : "w-5 h-5"} text-brand-purple`} />
                ) : (
                  <VolumeX className={`${isElderlyMode ? "w-6 h-6" : "w-5 h-5"} text-foreground/60`} />
                )}
              </button>
              <button
                onClick={onClose}
                className={`${isElderlyMode ? "w-12 h-12" : "w-10 h-10"} rounded-full flex items-center justify-center transition-colors hover:bg-brand-purple/10`}
                style={{ background: "rgba(255, 255, 255, 0.88)", border: "1px solid rgba(120,80,220,0.18)" }}
              >
                <X className={`${isElderlyMode ? "w-6 h-6" : "w-5 h-5"} text-foreground/60`} />
              </button>
            </div>
        </div>

        {/* Messages Area - Scrollable (chat first) */}
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
                {msg.type === "ai" && msg.card?.kind === "send_money" ? (
                  <div className="flex max-w-[min(100%,360px)] flex-col items-start gap-2">
                    {msg.card.phase === "preview" ? (
                      <SendMoneyPreviewCard
                        recipient={msg.card.recipient}
                        amount={msg.card.amount}
                        isElderlyMode={isElderlyMode}
                        onApprove={() => handleApproveSendMoney(msg.id)}
                      />
                    ) : msg.card.phase === "face_verifying" ? (
                      <SendMoneyFaceVerifyCard isElderlyMode={isElderlyMode} />
                    ) : msg.card.phase === "receipt" && msg.card.refNo ? (
                      <SendMoneyReceiptCard
                        recipient={msg.card.recipient}
                        amount={msg.card.amount}
                        refNo={msg.card.refNo}
                        isElderlyMode={isElderlyMode}
                        onNotify={handleReceiptNotify}
                      />
                    ) : null}
                    <p
                      className={`pl-1 text-muted-foreground ${isElderlyMode ? "text-sm" : "text-xs"}`}
                    >
                      {formatMessageTime(msg.timestamp)}
                    </p>
                    {msg.text ? (
                      <div
                        className={`max-w-full rounded-2xl rounded-bl-md px-4 py-3 text-foreground ${
                          isElderlyMode ? "text-lg py-4" : "text-base"
                        }`}
                        style={{
                          background: "rgba(255,255,255,0.9)",
                          border: "1px solid rgba(120, 80, 220, 0.16)",
                        }}
                      >
                        {msg.text}
                      </div>
                    ) : null}
                  </div>
                ) : (
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
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Divider */}
        <div className="px-5 shrink-0">
          <div className="h-px bg-gradient-to-r from-transparent via-brand-purple/30 to-transparent" />
        </div>

        {/* Quick Actions - Above input */}
        <div className="px-5 py-3 shrink-0">
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

        {/* Input Area - Fixed at bottom */}
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
                onKeyDown={(e) => e.key === "Enter" && void handleSend()}
              placeholder={`Message TNGReach ${currentPageLabel ? ` about ${currentPageLabel}` : ""}`}
              className={`flex-1 bg-transparent px-4 py-2.5 text-foreground placeholder:text-foreground/45 focus:outline-none ${
                isElderlyMode ? "text-lg" : "text-base"
              }`}
            />

            <button
              onClick={toggleListening}
              disabled={isTranscribing}
              className={`${isElderlyMode ? "w-11 h-11" : "w-10 h-10"} rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                isListening
                  ? "bg-[#F85149] animate-pulse"
                  : "bg-brand-purple/15 hover:bg-brand-purple/25"
              }`}
            >
              {isListening ? (
                <MicOff className={`${isElderlyMode ? "w-5 h-5" : "w-4 h-4"} text-white`} />
              ) : (
                <Mic className={`${isElderlyMode ? "w-5 h-5" : "w-4 h-4"} text-foreground/60`} />
              )}
            </button>

            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || isSending}
              className={`${isElderlyMode ? "w-11 h-11" : "w-10 h-10"} rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                background: input.trim() && !isSending
                  ? "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)"
                  : "rgba(120, 80, 220, 0.18)",
                boxShadow:
                  input.trim() && !isSending ? "0 4px 15px rgba(88, 150, 253, 0.4)" : "none",
              }}
            >
              <Send className={`${isElderlyMode ? "w-5 h-5" : "w-4 h-4"} text-white`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

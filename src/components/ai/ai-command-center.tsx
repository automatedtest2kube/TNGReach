"use client";

import { useState, useRef, useEffect } from "react";
import { X, Mic, Send, MicOff } from "lucide-react";
import { Mascot } from "@/components/Mascot";
import { useAccessibility } from "@/context/accessibility-context";

interface AICommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (screen: string) => void;
  currentScreen?: string;
}

interface Message {
  id: string;
  type: "user" | "ai";
  text: string;
  timestamp: Date;
}

export function AICommandCenter({ isOpen, onClose, onNavigate, currentScreen }: AICommandCenterProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      text: "Hi Sarah! How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const { isElderlyMode } = useAccessibility();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { label: "Send RM50 to Sarah", action: "send" },
    { label: "Top up RM100", action: "topup" },
    { label: "Pay electricity bill", action: "bills" },
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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: getAIResponse(input, currentPageLabel),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 800);
  };

  const getAIResponse = (query: string, pageContext: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("send") || lowerQuery.includes("transfer")) {
      return "I can help you send money. Who would you like to send to and how much?";
    }
    if (lowerQuery.includes("balance")) {
      return "Your current balance is RM 2,458.50. Would you like to top up?";
    }
    if (lowerQuery.includes("bill") || lowerQuery.includes("pay")) {
      return "I can help you pay bills. You have 2 pending bills: Electric (RM 85.20) and Internet (RM 129.00).";
    }
    if (lowerQuery.includes("spend") || lowerQuery.includes("insight")) {
      return "This month you've spent RM 1,250.50, up 14.8% from last month. Food & Dining is your highest category at 34%.";
    }
    return "I understand. Let me help you with that. What would you like to do?";
  };

  const handleQuickAction = (action: string) => {
    if (onNavigate) {
      onClose();
      onNavigate(action);
    }
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setInput("Check my spending this month");
        setIsListening(false);
      }, 2000);
    }
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
                  Ask anything. 
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${isElderlyMode ? "w-12 h-12" : "w-10 h-10"} rounded-full flex items-center justify-center transition-colors hover:bg-brand-purple/10`}
              style={{ background: "rgba(255, 255, 255, 0.88)", border: "1px solid rgba(120,80,220,0.18)" }}
            >
              <X className={`${isElderlyMode ? "w-6 h-6" : "w-5 h-5"} text-foreground/60`} />
            </button>
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
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={`Message TNGReach ${currentPageLabel ? ` about ${currentPageLabel}` : ""}`}
              className={`flex-1 bg-transparent px-4 py-2.5 text-foreground placeholder:text-foreground/45 focus:outline-none ${
                isElderlyMode ? "text-lg" : "text-base"
              }`}
            />

            <button
              onClick={toggleListening}
              className={`${isElderlyMode ? "w-11 h-11" : "w-10 h-10"} rounded-full flex items-center justify-center transition-all ${
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
              onClick={handleSend}
              disabled={!input.trim()}
              className={`${isElderlyMode ? "w-11 h-11" : "w-10 h-10"} rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)"
                  : "rgba(120, 80, 220, 0.18)",
                boxShadow: input.trim() ? "0 4px 15px rgba(88, 150, 253, 0.4)" : "none",
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

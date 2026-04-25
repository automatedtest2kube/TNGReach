"use client";

import { ArrowLeft, Mic, MicOff, Volume2, Send, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/accessibility-context";

interface AIVoiceScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export function AIVoiceScreen({ onBack, onNavigate }: AIVoiceScreenProps) {
  const [isListening, setIsListening] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [inputText, setInputText] = useState("");
  const { elderlyMode, t } = useAccessibility();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your PayEase assistant. How can I help you today?",
      isUser: false,
      timestamp: "Just now",
    },
  ]);

  const suggestedActions = [
    { text: "Send RM 50 to Ahmad", action: "send" },
    { text: "Pay my electricity bill", action: "bills" },
    { text: "Show my spending this month", action: "insights" },
    { text: "Help me top up", action: "topup" },
  ];

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice recognition
      setTimeout(() => {
        setIsListening(false);
        handleSendMessage("Send money to Ahmad");
      }, 3000);
    }
  };

  const handleSendMessage = (text: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text,
      isUser: true,
      timestamp: "Just now",
    };
    setMessages([...messages, userMessage]);
    setInputText("");

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        text: "I can help you with that! Would you like me to open the Send Money screen for Ahmad Rahman?",
        isUser: false,
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleSuggestedAction = (action: string) => {
    if (onNavigate) {
      onNavigate(action);
    }
  };

  // Chat Mode
  if (showChat) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <button
            onClick={() => setShowChat(false)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Chat History
          </h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex mb-4 ${msg.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.isUser
                    ? "gradient-primary text-primary-foreground rounded-br-md"
                    : "bg-card text-foreground rounded-bl-md"
                }`}
              >
                <p className={`${elderlyMode ? "text-lg" : ""}`}>{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${msg.isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={handleVoiceToggle}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isListening ? "bg-danger" : "bg-muted"}`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Mic className="w-5 h-5 text-foreground" />
              )}
            </button>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className={`flex-1 bg-muted rounded-full px-4 outline-none ${elderlyMode ? "h-14 text-lg" : "h-12"}`}
              onKeyPress={(e) => e.key === "Enter" && inputText && handleSendMessage(inputText)}
            />
            <button
              onClick={() => inputText && handleSendMessage(inputText)}
              className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shrink-0"
            >
              <Send className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Voice Mode (Full Screen)
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
          {t("voiceAssistant")}
        </h1>
        <button
          onClick={() => setShowChat(true)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <MessageCircle className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* Voice Animation */}
        <div className="relative mb-8">
          {/* Outer rings */}
          {isListening && (
            <>
              <div className="absolute inset-0 w-40 h-40 rounded-full bg-primary/10 animate-ping" />
              <div className="absolute inset-4 w-32 h-32 rounded-full bg-primary/20 animate-pulse" />
            </>
          )}
          {/* Main button */}
          <button
            onClick={handleVoiceToggle}
            className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
              isListening ? "gradient-primary scale-110" : "bg-card shadow-lg"
            }`}
          >
            {isListening ? (
              <Volume2 className="w-12 h-12 text-primary-foreground animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-primary" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <p className={`text-foreground font-semibold mb-2 ${elderlyMode ? "text-2xl" : "text-xl"}`}>
          {isListening ? "Listening..." : "Tap to speak"}
        </p>
        <p className={`text-muted-foreground text-center max-w-xs ${elderlyMode ? "text-lg" : ""}`}>
          {isListening
            ? "Speak now, I'm listening to your request"
            : "Ask me to send money, pay bills, or check your balance"}
        </p>
      </div>

      {/* Suggested Actions */}
      <div className="px-5 pb-8">
        <p className={`text-muted-foreground mb-3 ${elderlyMode ? "text-lg" : "text-sm"}`}>
          Suggested Actions
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestedActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedAction(action.action)}
              className={`px-4 py-2 bg-card rounded-full text-foreground hover:bg-primary hover:text-primary-foreground transition-colors ${elderlyMode ? "text-base" : "text-sm"}`}
            >
              {action.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

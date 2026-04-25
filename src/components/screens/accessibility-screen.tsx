"use client";

import { ChevronLeft, Eye, MessageCircle, Type, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/context/accessibility-context";

interface AccessibilityScreenProps {
  onBack: () => void;
}

const pageStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

const pageItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 32 },
  },
};

export function AccessibilityScreen({ onBack }: AccessibilityScreenProps) {
  const {
    elderlyMode,
    setElderlyMode,
    voiceEnabled,
    setVoiceEnabled,
    chatBubbleEnabled,
    setChatBubbleEnabled,
    t,
  } = useAccessibility();

  return (
    <motion.div
      className="flex min-h-screen flex-1 flex-col px-5 pb-28"
      style={{
        background:
          "linear-gradient(100deg, oklch(0.95 0.04 270) 0%, oklch(0.94 0.045 285) 45%, oklch(0.95 0.05 70) 100%)",
      }}
      initial="hidden"
      animate="show"
      variants={pageStagger}
    >
      <motion.div variants={pageItem} className="mb-4 flex items-center gap-4 py-4">
        <motion.button
          type="button"
          onClick={onBack}
          className="icon-btn-glass flex h-12 w-12 items-center justify-center rounded-full text-foreground ring-1 ring-brand-purple/10 active:scale-90"
          whileTap={{ scale: 0.94 }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <h1
          className={`font-extrabold tracking-tight text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}
        >
          {t("accessibilitySettings")}
        </h1>
      </motion.div>

      <motion.div variants={pageItem} className="py-4">
        <div className="flex flex-col gap-2">
          {[
            {
              key: "elderly",
              icon: Eye,
              iconStyle: {
                background:
                  "linear-gradient(135deg, oklch(0.6 0.15 295 / 0.25), oklch(0.6 0.15 295 / 0.08))",
              },
              title: t("elderlyMode"),
              sub: "Larger text and buttons",
              checked: elderlyMode,
              onChange: setElderlyMode,
            },
            {
              key: "large",
              icon: Type,
              iconStyle: {
                background:
                  "linear-gradient(135deg, oklch(0.62 0.18 265 / 0.25), oklch(0.62 0.18 265 / 0.08))",
              },
              title: "Large Text",
              sub: "Increase font size",
              checked: elderlyMode,
              onChange: setElderlyMode,
            },
            {
              key: "voice",
              icon: Volume2,
              iconStyle: {
                background:
                  "linear-gradient(135deg, oklch(0.75 0.12 280 / 0.3), oklch(0.75 0.12 280 / 0.1))",
              },
              title: t("voiceAssistant"),
              sub: "Voice guidance enabled",
              checked: voiceEnabled,
              onChange: setVoiceEnabled,
            },
            {
              key: "bubble",
              icon: MessageCircle,
              iconStyle: {
                background:
                  "linear-gradient(135deg, oklch(0.65 0.16 150 / 0.28), oklch(0.65 0.16 150 / 0.1))",
              },
              title: t("aiBubble"),
              sub: "Floating AI assistant button",
              checked: chatBubbleEnabled,
              onChange: setChatBubbleEnabled,
            },
          ].map((row) => {
            const RowIcon = row.icon;
            return (
              <motion.div
                key={row.key}
                className="card-glass flex items-center justify-between rounded-2xl p-3 shadow-soft ring-1 ring-white/20 active:bg-brand-purple/5"
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={row.iconStyle}
                  >
                    <RowIcon className="h-5 w-5 text-brand-purple" />
                  </div>
                  <div>
                    <span className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                      {row.title}
                    </span>
                    <p className={`text-foreground/50 ${elderlyMode ? "text-base" : "text-sm"}`}>
                      {row.sub}
                    </p>
                  </div>
                </div>
                <Switch checked={row.checked} onCheckedChange={row.onChange} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

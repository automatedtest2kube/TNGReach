"use client";

import {
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  Eye,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Check,
  Users,
  Award,
  Heart,
  Sparkles,
  Type,
  Volume2,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/context/accessibility-context";

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

interface ProfileScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function ProfileScreen({ onBack, onNavigate }: ProfileScreenProps) {
  const {
    elderlyMode,
    setElderlyMode,
    language,
    setLanguage,
    voiceEnabled,
    setVoiceEnabled,
    chatBubbleEnabled,
    setChatBubbleEnabled,
    t,
  } = useAccessibility();
  const [notifications, setNotifications] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const languages = [
    { code: "en" as const, name: "English" },
    { code: "bm" as const, name: "Bahasa Malaysia" },
    { code: "zh" as const, name: "中文" },
  ];

  const currentLanguage = languages.find((l) => l.code === language)?.name || "English";

  const menuItems = [
    { icon: User, label: "Personal Information", value: "", action: () => {} },
    {
      icon: Globe,
      label: t("language"),
      value: currentLanguage,
      action: () => setShowLanguageModal(true),
    },
    { icon: Users, label: t("familyModule"), value: "", action: () => onNavigate?.("family") },
    {
      icon: Award,
      label: t("trustScore"),
      value: "720",
      action: () => onNavigate?.("trust-score"),
    },
    {
      icon: Heart,
      label: t("crowdfunding"),
      value: "",
      action: () => onNavigate?.("crowdfunding"),
    },
    {
      icon: Sparkles,
      label: t("spendingInsights"),
      value: "",
      action: () => onNavigate?.("ai-insights"),
    },
    {
      icon: Bell,
      label: t("notifications"),
      value: "",
      toggle: true,
      checked: notifications,
      onChange: () => setNotifications(!notifications),
    },
    { icon: Shield, label: "Security & Privacy", value: "", action: () => {} },
    { icon: HelpCircle, label: t("needHelp"), value: "", action: () => {} },
  ];

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
          {t("profile")} & {t("settings")}
        </h1>
      </motion.div>

      <motion.div
        variants={pageItem}
        className="card-glass flex items-center gap-4 rounded-3xl p-4 py-6 shadow-soft ring-1 ring-white/35"
      >
        <div
          className={`${elderlyMode ? "h-24 w-24" : "h-20 w-20"} card-sheen relative flex items-center justify-center overflow-hidden rounded-full text-2xl font-bold text-white shadow-glow ${elderlyMode ? "text-3xl" : ""}`}
          style={{ background: "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)" }}
        >
          SA
        </div>
        <div className="min-w-0 flex-1">
          <h2
            className={`font-bold tracking-tight text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}
          >
            Sarah Ahmad
          </h2>
          <p className={`text-foreground/50 ${elderlyMode ? "text-lg" : ""}`}>+60 12-345 6789</p>
          <p className={`text-foreground/50 ${elderlyMode ? "text-base" : "text-sm"}`}>
            sarah.ahmad@email.com
          </p>
        </div>
      </motion.div>

      <div className="my-2 border-b border-brand-purple/10" />

      <motion.div variants={pageItem} className="py-4">
        <h3
          className={`section-title mb-4 ${elderlyMode ? "text-xl" : "text-lg"}`}
        >
          {t("accessibilitySettings")}
        </h3>

        <div className="flex flex-col gap-2">
          {[
            {
              key: "elderly",
              icon: Eye,
              iconStyle: { background: "linear-gradient(135deg, oklch(0.6 0.15 295 / 0.25), oklch(0.6 0.15 295 / 0.08))" },
              title: t("elderlyMode"),
              sub: "Larger text and buttons",
              checked: elderlyMode,
              onChange: setElderlyMode,
            },
            {
              key: "large",
              icon: Type,
              iconStyle: { background: "linear-gradient(135deg, oklch(0.62 0.18 265 / 0.25), oklch(0.62 0.18 265 / 0.08))" },
              title: "Large Text",
              sub: "Increase font size",
              checked: elderlyMode,
              onChange: setElderlyMode,
            },
            {
              key: "voice",
              icon: Volume2,
              iconStyle: { background: "linear-gradient(135deg, oklch(0.75 0.12 280 / 0.3), oklch(0.75 0.12 280 / 0.1))" },
              title: t("voiceAssistant"),
              sub: "Voice guidance enabled",
              checked: voiceEnabled,
              onChange: setVoiceEnabled,
            },
            {
              key: "bubble",
              icon: MessageCircle,
              iconStyle: { background: "linear-gradient(135deg, oklch(0.65 0.16 150 / 0.28), oklch(0.65 0.16 150 / 0.1))" },
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

      <div className="my-1 border-b border-brand-purple/10" />

      <motion.div variants={pageItem} className="py-2">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const Wrapper = item.toggle ? "div" : "button";
          return (
            <Wrapper
              key={index}
              type={item.toggle ? undefined : "button"}
              onClick={item.toggle ? undefined : item.action}
              className={`flex w-full items-center gap-4 border-b border-brand-purple/10 py-4 last:border-0 ${elderlyMode ? "py-5" : ""} ${!item.toggle ? "cursor-pointer active:bg-brand-purple/8" : ""} rounded-xl`}
            >
              <div
                className={`${elderlyMode ? "h-12 w-12" : "h-10 w-10"} card-glass flex items-center justify-center rounded-xl text-brand-blue shadow-soft`}
              >
                <IconComponent
                  className={`${elderlyMode ? "h-6 w-6" : "h-5 w-5"} text-brand-purple`}
                />
              </div>
              <span
                className={`min-w-0 flex-1 text-left font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}
              >
                {item.label}
              </span>
              {item.toggle ? (
                <Switch checked={item.checked} onCheckedChange={item.onChange} />
              ) : (
                <>
                  {item.value && (
                    <span className={`text-foreground/50 ${elderlyMode ? "text-base" : "text-sm"}`}>
                      {item.value}
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 shrink-0 text-foreground/40" />
                </>
              )}
            </Wrapper>
          );
        })}
      </motion.div>

      <motion.button
        type="button"
        variants={pageItem}
        className={`mt-2 flex items-center gap-4 rounded-2xl py-4 active:bg-destructive/6 ${elderlyMode ? "py-5" : ""}`}
        whileTap={{ scale: 0.99 }}
      >
        <div
          className={`${elderlyMode ? "h-12 w-12" : "h-10 w-10"} flex items-center justify-center rounded-xl`}
          style={{ background: "rgba(248, 81, 73, 0.12)" }}
        >
          <LogOut className={`${elderlyMode ? "h-6 w-6" : "h-5 w-5"} text-destructive`} />
        </div>
        <span className={`font-medium text-destructive ${elderlyMode ? "text-lg" : ""}`}>
          Log Out
        </span>
      </motion.button>

      <p
        className={`mt-auto pt-8 text-center text-foreground/45 ${elderlyMode ? "text-base" : "text-sm"}`}
      >
        TNG Reach v2.4.1
      </p>

      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            className="w-full max-w-lg rounded-t-3xl p-6 pb-10 shadow-glow"
            style={{
              background:
                "linear-gradient(140deg, rgba(255,255,255,0.98) 0%, rgba(242,236,255,0.98) 55%, rgba(255,244,233,0.95) 100%)",
            }}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
          >
            <h3
              className={`section-title mb-4 ${elderlyMode ? "text-2xl" : "text-lg"}`}
            >
              Select Language
            </h3>
            <div className="flex flex-col gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                  className={`flex items-center justify-between rounded-xl px-4 transition-colors active:bg-brand-purple/10 ${
                    language === lang.code
                      ? "bg-gradient-to-r from-brand-blue/12 to-brand-purple/12"
                      : ""
                  } ${elderlyMode ? "py-5" : "py-4"}`}
                >
                  <span
                    className={`font-medium ${
                      language === lang.code ? "text-brand-blue" : "text-foreground"
                    } ${elderlyMode ? "text-lg" : ""}`}
                  >
                    {lang.name}
                  </span>
                  {language === lang.code && <Check className="h-5 w-5 text-brand-purple" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowLanguageModal(false)}
              className={`mt-4 w-full rounded-full py-3 font-medium text-foreground/50 transition active:bg-brand-purple/8 ${elderlyMode ? "text-lg" : ""}`}
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

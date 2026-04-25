"use client";

import { Home, Clock, QrCode, Sparkles, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAccessibility } from "@/context/accessibility-context";

interface BottomNavProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  onOpenAI?: () => void;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const { isElderlyMode, t } = useAccessibility();

  if (isElderlyMode) {
    const elderlyNav = [
      { id: "home", icon: Home, label: "Home" },
      { id: "scan", icon: QrCode, label: "Scan" },
      { id: "history", icon: Clock, label: "History" },
      { id: "profile", icon: User, label: "Me" },
    ];

    return (
      <nav
        className="safe-bottom fixed bottom-0 left-0 right-0 z-40"
        style={{
          background:
            "linear-gradient(140deg, rgba(255,255,255,0.95) 0%, rgba(242,236,255,0.95) 55%, rgba(255,244,233,0.95) 100%)",
          borderTop: "1px solid rgba(120,80,220,0.18)",
          boxShadow: "0 -8px 24px rgba(120,80,220,0.15)",
        }}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-2">
          {elderlyNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3"
                style={{
                  background: isActive ? "rgba(88,150,253,0.15)" : "transparent",
                  border: isActive ? "2px solid rgba(88,150,253,0.5)" : "2px solid transparent",
                  minHeight: 76,
                }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className="h-8 w-8"
                  style={{ color: isActive ? "#5896FD" : "#6B7280" }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className="text-base font-bold"
                  style={{ color: isActive ? "#5896FD" : "#6B7280" }}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    );
  }

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "history", icon: Clock, label: "History" },
    { id: "scan", icon: QrCode, label: "Scan", isCenter: true },
    { id: "ai", icon: Sparkles, label: "Insight" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <nav
      className="glass-strong safe-bottom fixed bottom-0 left-0 right-0 z-40"
      style={{
        boxShadow: "0 -10px 32px -12px color-mix(in oklab, var(--color-brand-purple) 32%, white)",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive =
            activeScreen === item.id || (item.id === "ai" && activeScreen === "ai-insights");

          if (item.isCenter) {
            return (
              <div key={item.id} className="relative -mt-6">
                <div
                  className="nav-fab-halo pointer-events-none absolute -inset-1.5 rounded-full border-2 border-[#806EF8]/35"
                  aria-hidden
                />
                <motion.button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className="relative flex h-16 w-16 touch-manipulation items-center justify-center overflow-hidden rounded-full"
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 450, damping: 28 }}
                  style={{
                    background: "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)",
                    boxShadow:
                      "0 8px 28px color-mix(in oklab, var(--color-brand-purple) 50%, transparent), inset 0 1px 0 rgba(255,255,255,0.32)",
                  }}
                  aria-label={item.label}
                >
                  <div
                    className="absolute right-3 left-3 z-0 h-0.5 rounded-full bg-white/55"
                    style={{
                      animation: "scanLine 2.2s ease-in-out infinite",
                      boxShadow: "0 0 10px rgba(255,255,255,0.45)",
                    }}
                  />
                  <IconComponent className="relative z-10 h-7 w-7 text-white" />
                  <div className="absolute left-2.5 top-2.5 z-0 h-3 w-3 rounded-tl border-l-2 border-t-2 border-white/40" />
                  <div className="absolute top-2.5 right-2.5 z-0 h-3 w-3 rounded-tr border-r-2 border-t-2 border-white/40" />
                  <div className="absolute bottom-2.5 left-2.5 z-0 h-3 w-3 rounded-bl border-b-2 border-l-2 border-white/40" />
                  <div className="absolute right-2.5 bottom-2.5 z-0 h-3 w-3 rounded-br border-b-2 border-r-2 border-white/40" />
                </motion.button>
              </div>
            );
          }

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id === "ai" ? "ai-insights" : item.id)}
              className={`relative touch-target flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 ${
                isActive
                  ? "bg-[color-mix(in_oklab,var(--color-brand-blue)_16%,white)]"
                  : "active:bg-[color-mix(in_oklab,var(--color-brand-blue)_10%,transparent)]"
              } `}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              aria-label={item.label}
            >
              <IconComponent
                className="h-6 w-6"
                style={{ color: isActive ? "#5896FD" : "#6B7280" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: isActive ? "#5896FD" : "#6B7280" }}
              >
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#5896FD]"
                  style={{ boxShadow: "0 0 8px #5896FD" }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 16%; opacity: 0.35; }
          50% { top: 72%; opacity: 0.85; }
        }
      `}</style>
    </nav>
  );
}

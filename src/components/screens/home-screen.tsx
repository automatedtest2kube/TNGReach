"use client";

import {
  Send,
  QrCode,
  Plus,
  Receipt,
  PieChart,
  ShoppingBag,
  Coffee,
  Utensils,
  Car,
  Eye,
  EyeOff,
  Lightbulb,
  HelpCircle,
  ChevronRight,
  Zap,
  Car as ParkingIcon,
  TrendingUp,
  Phone,
  ShieldCheck,
  Mic,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAccessibility } from "@/context/accessibility-context";
import { useWalletData } from "@/hooks/use-wallet-data";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  activeUserId?: number;
}

const homeStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const homeItem = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

export function HomeScreen({ onNavigate, activeUserId }: HomeScreenProps) {
  const [showBalance, setShowBalance] = useState(true);
  const { isElderlyMode, t } = useAccessibility();
  const { summary } = useWalletData(activeUserId);
  const userName = summary?.user.fullName?.split(" ")[0] || "there";
  const walletCurrency = summary?.wallet?.currency || "MYR";
  const walletBalance = Number(summary?.wallet?.balance ?? 2458.5);
  const recentTx = (summary?.transactions ?? []).slice(0, 5).map((tx, idx) => ({
    id: tx.transactionId ?? idx + 1,
    name: tx.description || tx.transactionType,
    time: new Date(tx.transactionDate).toLocaleDateString(),
    amount: Number(tx.amount),
  }));

  const balanceText = useMemo(
    () =>
      showBalance
        ? `${walletCurrency} ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `${walletCurrency} ••••••`,
    [showBalance, walletBalance, walletCurrency],
  );

  // =============================================================
  // ELDERLY MODE: completely simplified layout
  // Huge numbers, 4 giant buttons, call-family shortcut, simple
  // transaction list. No charts / no AI cards / no clutter.
  // =============================================================
  if (isElderlyMode) {
    const bigActions = [
      {
        icon: Send,
        label: t("sendToFamily"),
        sub: "Send money safely",
        screen: "send",
        color: "#5896FD",
        bg: "linear-gradient(135deg, #1E3A8A 0%, #5896FD 100%)",
      },
      {
        icon: QrCode,
        label: t("payShop"),
        sub: "Scan QR code",
        screen: "scan",
        color: "#3FB950",
        bg: "linear-gradient(135deg, #14532D 0%, #3FB950 100%)",
      },
      {
        icon: Plus,
        label: t("addMoney"),
        sub: "Top up wallet",
        screen: "topup",
        color: "#806EF8",
        bg: "linear-gradient(135deg, #3B2A8F 0%, #806EF8 100%)",
      },
      {
        icon: Receipt,
        label: t("payBill"),
        sub: "Utility & more",
        screen: "bills",
        color: "#D29922",
        bg: "linear-gradient(135deg, #78350F 0%, #D29922 100%)",
      },
    ];

    const simpleTx =
      recentTx.length > 0
        ? recentTx.slice(0, 3)
        : [
            { id: 1, name: "Grocery Store", time: "Today", amount: -45.5 },
            { id: 2, name: "Top Up Wallet", time: "Yesterday", amount: 200.0 },
            { id: 3, name: "Coffee Shop", time: "Yesterday", amount: -8.9 },
          ];

    return (
      <div className="flex-1 overflow-auto pb-32">
        {/* Verified banner - provides trust */}
        <div
          className="mx-5 mt-4 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: "rgba(63, 185, 80, 0.15)",
            border: "2px solid rgba(63, 185, 80, 0.4)",
          }}
        >
          <ShieldCheck className="w-6 h-6 text-[#3FB950] flex-shrink-0" />
          <span className="text-base font-semibold text-[#3FB950]">{t("verifiedSecure")}</span>
        </div>

        {/* Greeting */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-xl text-[#C9D1D9]">Hello,</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-foreground">
            {userName}
          </h1>
        </div>

        {/* Big Balance Card */}
        <div className="mx-5 mb-6">
          <div
            className="rounded-3xl p-7"
            style={{
              background: "linear-gradient(135deg, #5896FD 0%, #806EF8 60%, #B0A4FF 100%)",
              boxShadow: "0 12px 40px rgba(88, 150, 253, 0.35)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-lg font-semibold text-white">{t("myMoney")}</p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="p-3 rounded-full bg-white/25 active:scale-95 transition-transform"
                aria-label={showBalance ? "Hide money" : "Show money"}
                style={{ minHeight: 56, minWidth: 56 }}
              >
                {showBalance ? (
                  <Eye className="w-6 h-6 text-white" />
                ) : (
                  <EyeOff className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
            <p className="text-5xl font-bold text-white tracking-tight">
              {balanceText}
            </p>
          </div>
        </div>

        {/* Tap & Speak big button */}
        <button
          onClick={() => onNavigate("ai-voice")}
          className="mx-5 mb-6 w-[calc(100%-2.5rem)] flex items-center gap-4 px-6 py-5 rounded-2xl transition-transform active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)",
            boxShadow: "0 8px 24px rgba(128, 110, 248, 0.35)",
            minHeight: 80,
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.25)" }}
          >
            <Mic className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-xl font-bold text-white">{t("tapToSpeak")}</p>
            <p className="text-base text-white/85">Say what you want to do</p>
          </div>
        </button>

        {/* Big Actions - 2x2 grid, HUGE buttons */}
        <div className="px-5">
          <h2 className="text-2xl font-bold text-[#E6EDF3] mb-4">What would you like to do?</h2>
          <div className="grid grid-cols-2 gap-4">
            {bigActions.map((action) => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.screen)}
                className="flex flex-col items-center gap-3 p-5 rounded-3xl transition-transform active:scale-95"
                style={{
                  background: action.bg,
                  minHeight: 160,
                  boxShadow: `0 8px 24px ${action.color}40`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.22)" }}
                >
                  <action.icon className="w-9 h-9 text-white" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white leading-tight">{action.label}</p>
                  <p className="text-sm text-white/80 mt-1">{action.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Help row: Call family + 24/7 Help */}
        <div className="px-5 mt-6 grid grid-cols-2 gap-4">
          <button
            onClick={() => onNavigate("family")}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-transform active:scale-95"
            style={{
              background: "#1A1F29",
              border: "2px solid #3FB950",
              minHeight: 110,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(63, 185, 80, 0.2)" }}
            >
              <Phone className="w-6 h-6 text-[#3FB950]" />
            </div>
            <span className="text-base font-bold text-[#E6EDF3]">{t("callFamily")}</span>
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-transform active:scale-95"
            style={{
              background: "#1A1F29",
              border: "2px solid #5896FD",
              minHeight: 110,
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(88, 150, 253, 0.2)" }}
            >
              <HelpCircle className="w-6 h-6 text-[#5896FD]" />
            </div>
            <span className="text-base font-bold text-[#E6EDF3]">{t("getHelp")}</span>
          </button>
        </div>

        {/* Recent transactions - simplified */}
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-[#E6EDF3]">{t("whatPaid")}</h2>
            <button
              onClick={() => onNavigate("history")}
              className="text-lg font-semibold text-[#5896FD] underline underline-offset-4"
            >
              {t("seeAll")}
            </button>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#1A1F29",
              border: "2px solid rgba(255,255,255,0.12)",
            }}
          >
            {simpleTx.map((tx, index) => {
              const isIn = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4"
                  style={{
                    borderBottom:
                      index !== simpleTx.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isIn ? "rgba(63, 185, 80, 0.18)" : "rgba(88, 150, 253, 0.18)",
                    }}
                  >
                    {isIn ? (
                      <Plus className="w-7 h-7 text-[#3FB950]" />
                    ) : (
                      <Send className="w-7 h-7 text-[#5896FD]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-[#E6EDF3] truncate">{tx.name}</p>
                    <p className="text-base text-[#C9D1D9]">
                      {isIn ? t("moneyIn") : t("moneyOut")} · {tx.time}
                    </p>
                  </div>
                  <p
                    className="text-xl font-bold flex-shrink-0"
                    style={{ color: isIn ? "#3FB950" : "#E6EDF3" }}
                  >
                    {isIn ? "+" : "-"}RM {Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simple Mode reminder */}
        <div className="px-5 mt-6">
          <button
            onClick={() => onNavigate("profile")}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl"
            style={{
              background: "rgba(128, 110, 248, 0.12)",
              border: "2px solid rgba(128, 110, 248, 0.3)",
            }}
          >
            <Users className="w-6 h-6 text-[#B0A4FF] flex-shrink-0" />
            <span className="flex-1 text-left text-base font-semibold text-[#E6EDF3]">
              {t("simpleMode")} · {t("largeButtons")}
            </span>
            <ChevronRight className="w-6 h-6 text-[#B0A4FF]" />
          </button>
        </div>
      </div>
    );
  }

  // =============================================================
  // STANDARD MODE - original design
  // =============================================================
  const quickActions = [
    { icon: Send, label: t("sendMoney"), screen: "send", color: "#5896FD" },
    { icon: QrCode, label: t("scanPay"), screen: "scan", color: "#3FB950" },
    { icon: Plus, label: t("topUp"), screen: "topup", color: "#806EF8" },
    { icon: Receipt, label: t("payBills"), screen: "bills", color: "#D29922" },
    { icon: PieChart, label: t("viewSpending"), screen: "ai-insights", color: "#B0A4FF" },
    { icon: ParkingIcon, label: t("parking"), screen: "parking", color: "#AECDFF" },
  ];

  const transactions =
    recentTx.length > 0
      ? recentTx.map((tx) => ({
          ...tx,
          icon: tx.amount > 0 ? Plus : Send,
        }))
      : [
          {
            id: 1,
            icon: ShoppingBag,
            name: "Grocery Store",
            time: "Today, 2:30 PM",
            amount: -45.5,
          },
          { id: 2, icon: Coffee, name: "Coffee Shop", time: "Today, 10:15 AM", amount: -8.9 },
          { id: 3, icon: Plus, name: "Top Up", time: "Yesterday", amount: 200.0 },
          { id: 4, icon: Utensils, name: "Restaurant", time: "Yesterday", amount: -32.0 },
          { id: 5, icon: Car, name: "Fuel Station", time: "Mar 18", amount: -55.0 },
        ];

  const monthlyData = [
    { month: "Jan", amount: 980, isActive: false },
    { month: "Feb", amount: 1120, isActive: false },
    { month: "Mar", amount: 1089, isActive: false },
    { month: "Apr", amount: 1250, isActive: true },
  ];
  const maxAmount = Math.max(...monthlyData.map((d) => d.amount));

  return (
    <motion.div
      className="flex-1 overflow-auto px-5 pb-28"
      initial="hidden"
      animate="show"
      variants={homeStagger}
    >
      {/* Greeting — soft ambient orbs (no pointer events) */}
      <motion.div variants={homeItem} className="relative overflow-hidden pt-6 pb-4">
        <div
          className="ambient-orb pointer-events-none absolute -right-6 -top-2 h-24 w-24 rounded-full bg-brand-purple/20 blur-2xl"
          aria-hidden
        />
        <div
          className="ambient-orb pointer-events-none absolute -left-8 top-8 h-20 w-20 rounded-full bg-brand-orange/15 blur-2xl [animation-delay:-2s]"
          aria-hidden
        />
        <p className="relative text-base text-foreground/55">{t("welcome")},</p>
        <h1 className="relative text-3xl font-extrabold tracking-tight text-foreground">
          {userName}
        </h1>
      </motion.div>

      {/* Balance Card */}
      <motion.div
        variants={homeItem}
        className="card-sheen card-gradient-glow relative mb-6 overflow-hidden rounded-[1.75rem] p-6 shadow-glow"
      >
        <div className="relative z-10 flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white/90">{t("walletBalance")}</p>
          <button
            type="button"
            onClick={() => setShowBalance(!showBalance)}
            className="rounded-full bg-white/20 p-2.5 ring-1 ring-white/15 backdrop-blur-sm transition active:scale-90 active:bg-white/30"
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? (
              <Eye className="h-5 w-5 text-white" />
            ) : (
              <EyeOff className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
        <p className="relative z-10 text-4xl font-bold tracking-tight text-white drop-shadow-sm">
          {balanceText}
        </p>
        <div className="relative z-10 mt-4 flex items-center gap-2 border-t border-white/25 pt-4">
          <div className="animate-bob rounded-full bg-white/25 p-1.5">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-white/90">+RM 123.50 this week</span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={homeItem} className="py-4">
        <h2 className="section-title mb-4 text-lg">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <motion.button
              key={action.label}
              type="button"
              onClick={() => onNavigate(action.screen)}
              className="card-glass flex touch-target flex-col items-center gap-3 rounded-2xl border border-white/45 p-4 shadow-soft ring-1 ring-white/15"
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, ${action.color}38, ${action.color}16)`,
                  boxShadow: `0 3px 14px ${action.color}32, inset 0 1px 0 color-mix(in srgb, ${action.color} 25%, transparent)`,
                }}
              >
                <action.icon className="h-6 w-6" style={{ color: action.color }} />
              </div>
              <span className="text-center text-xs font-semibold text-foreground">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* AI Suggestion Card */}
      <motion.div variants={homeItem} className="py-4">
        <motion.button
          type="button"
          onClick={() => onNavigate("ai-insights")}
          className="flex w-full items-center gap-4 rounded-2xl border border-brand-orange/30 bg-gradient-to-br from-brand-orange/15 to-destructive/5 p-5 shadow-[0_12px_40px_rgba(210,150,50,0.12)] ring-1 ring-brand-orange/20"
          whileTap={{ scale: 0.985 }}
        >
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #D29922 0%, #F85149 100%)",
              boxShadow: "0 4px 20px rgba(210, 153, 34, 0.45)",
            }}
          >
            <Lightbulb className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-semibold text-foreground">Spending Alert</p>
            <p className="text-sm text-brand-orange/90">
              You spent 15% more on food this week. Tap to see insights.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-3 py-1.5">
            <TrendingUp className="h-4 w-4 text-destructive" />
            <span className="text-sm font-semibold text-destructive">+15%</span>
          </div>
        </motion.button>
      </motion.div>

      {/* Monthly Comparison Mini Chart */}
      <motion.div variants={homeItem} className="py-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="section-title mb-0 text-base">This Month vs Previous</h3>
          <button
            type="button"
            onClick={() => onNavigate("ai-insights")}
            className="rounded-full border border-brand-purple/30 bg-white/70 px-3 py-1.5 text-xs font-semibold text-brand-purple shadow-soft transition active:scale-95"
          >
            Details
          </button>
        </div>
        <div className="card-glass p-4 ring-1 ring-white/25">
          <div className="mb-1 flex h-20 items-end justify-between gap-2">
            {monthlyData.map((data, i) => (
              <div
                key={data.month}
                className="flex h-full min-h-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <motion.div
                  className="w-full max-w-[3rem] rounded-lg"
                  style={{
                    height: `${(data.amount / maxAmount) * 100}%`,
                    minHeight: "20%",
                    background: data.isActive
                      ? "linear-gradient(180deg, #5896FD 0%, #806EF8 100%)"
                      : "rgba(120, 80, 220, 0.16)",
                    boxShadow: data.isActive
                      ? "0 4px 16px rgba(88, 150, 253, 0.45), inset 0 -2px 0 rgba(0,0,0,0.06)"
                      : "inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 24,
                    delay: 0.06 * i,
                  }}
                />
                <span className="text-[10px] font-semibold text-foreground/45">
                  RM {data.amount}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between">
            {monthlyData.map((data) => (
              <span
                key={data.month}
                className={`flex-1 text-center text-xs font-semibold ${
                  data.isActive ? "text-brand-blue" : "text-foreground/50"
                }`}
              >
                {data.month}
              </span>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 border-t border-brand-purple/15 pt-3">
            <TrendingUp className="h-4 w-4 text-destructive" />
            <span className="text-sm text-foreground/60">
              <span className="font-semibold text-destructive">+14.8%</span> vs last month (RM
              1,089)
            </span>
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
      <motion.div variants={homeItem} className="py-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title text-lg">{t("recentTransactions")}</h2>
          <button
            type="button"
            onClick={() => onNavigate("history")}
            className="rounded-full border border-foreground/10 bg-white/60 px-3 py-1.5 text-sm font-semibold text-foreground/80 backdrop-blur-sm transition active:scale-95"
          >
            {t("seeAll")}
          </button>
        </div>

        <div className="card-glass overflow-hidden">
          {transactions.slice(0, 5).map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * index, type: "spring", stiffness: 400, damping: 32 }}
              className={`list-item-glass flex items-center gap-4 p-4 active:bg-brand-purple/8 ${
                index !== 4 ? "border-b border-[rgba(120,80,220,0.1)]" : ""
              }`}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    tx.amount > 0 ? "rgba(63, 185, 80, 0.15)" : "rgba(88, 150, 253, 0.15)",
                }}
              >
                <tx.icon
                  className="h-5 w-5"
                  style={{ color: tx.amount > 0 ? "#3FB950" : "#5896FD" }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{tx.name}</p>
                <p className="text-sm text-foreground/55">{tx.time}</p>
              </div>
              <p
                className={`font-semibold ${tx.amount > 0 ? "text-[#3FB950]" : "text-foreground"}`}
              >
                {tx.amount > 0 ? "+" : ""}
                RM {Math.abs(tx.amount).toFixed(2)}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Elderly Mode Hint */}
      <motion.div variants={homeItem} className="py-4">
        <motion.button
          type="button"
          onClick={() => onNavigate("profile")}
          className="glass-light flex w-full items-center justify-between rounded-2xl p-4 ring-1 ring-brand-purple/10"
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 p-2">
              <HelpCircle className="h-5 w-5 text-brand-purple" />
            </div>
            <span className="text-left text-sm text-foreground/80">
              Need simpler UI? Try Elderly Mode in Settings
            </span>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-brand-purple" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

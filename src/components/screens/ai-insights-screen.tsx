"use client";

import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Utensils,
  Car,
  ShoppingBag,
  Coffee,
  Lightbulb,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAccessibility } from "@/context/accessibility-context";

const pageStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const pageItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 32 },
  },
};

interface AIInsightsScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function AIInsightsScreen({ onBack }: AIInsightsScreenProps) {
  const { isElderlyMode, t } = useAccessibility();

  const monthlyData = {
    total: 1250.5,
    lastMonth: 1089.2,
    change: 14.8,
    isUp: true,
  };

  const categories = [
    {
      name: "Food & Dining",
      icon: Utensils,
      amount: 420,
      percent: 34,
      change: 15,
      isUp: true,
      color: "#D29922",
    },
    {
      name: "Transport",
      icon: Car,
      amount: 285,
      percent: 23,
      change: -8,
      isUp: false,
      color: "#5896FD",
    },
    {
      name: "Shopping",
      icon: ShoppingBag,
      amount: 320,
      percent: 26,
      change: 22,
      isUp: true,
      color: "#806EF8",
    },
    {
      name: "Coffee & Drinks",
      icon: Coffee,
      amount: 145,
      percent: 12,
      change: 30,
      isUp: true,
      color: "#B0A4FF",
    },
  ];

  const insights = [
    {
      title: "Grab spending up 30%",
      description: "You spent RM 180 on Grab this month, up from RM 138 last month.",
      type: "warning",
    },
    {
      title: "Great job on utilities!",
      description: "Your utility bills are 12% lower than the average user.",
      type: "success",
    },
    {
      title: "Consider meal planning",
      description: "Your food spending is higher than usual. Try cooking at home more often.",
      type: "info",
    },
  ];

  // Extended monthly comparison data
  const chartData = [
    { month: "Jan", amount: 980, budget: 1000 },
    { month: "Feb", amount: 1120, budget: 1000 },
    { month: "Mar", amount: 1089, budget: 1100 },
    { month: "Apr", amount: 1250, budget: 1100 },
  ];
  const maxAmount = Math.max(...chartData.map((d) => Math.max(d.amount, d.budget)));

  return (
    <div
      className="flex min-h-screen flex-1 flex-col"
      style={{
        background:
          "linear-gradient(100deg, oklch(0.95 0.04 270) 0%, oklch(0.94 0.045 285) 45%, oklch(0.95 0.05 70) 100%)",
      }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center gap-4 px-5 py-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 34 }}
      >
        <motion.button
          type="button"
          onClick={onBack}
          className="icon-btn-glass flex h-12 w-12 items-center justify-center rounded-full text-foreground ring-1 ring-brand-purple/10 active:scale-90"
          whileTap={{ scale: 0.94 }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <h1
          className={`font-extrabold tracking-tight text-foreground ${isElderlyMode ? "text-2xl" : "text-xl"}`}
        >
          {t("spendingInsights")}
        </h1>
      </motion.div>

      <motion.div
        className="flex-1 overflow-auto px-5 pb-28"
        initial="hidden"
        animate="show"
        variants={pageStagger}
      >
        {/* Monthly Overview Card */}
        <motion.div variants={pageItem} className="card-sheen card-gradient-glow relative mb-6 overflow-hidden rounded-[1.75rem] p-6 shadow-glow ring-1 ring-white/25">
          <div className="relative z-10 mb-2 flex items-start justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-white/80">This Month</p>
              <p className={`font-bold text-white drop-shadow-sm ${isElderlyMode ? "text-4xl" : "text-3xl"}`}>
                RM {monthlyData.total.toFixed(2)}
              </p>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 ${
                monthlyData.isUp ? "bg-white/20" : "bg-white/20"
              }`}
            >
              {monthlyData.isUp ? (
                <TrendingUp className="h-4 w-4 text-white" />
              ) : (
                <TrendingDown className="h-4 w-4 text-white" />
              )}
              <span className="text-sm font-semibold text-white">{monthlyData.change}%</span>
            </div>
          </div>
          <p className="relative z-10 text-sm text-white/70">
            vs RM {monthlyData.lastMonth.toFixed(2)} last month
          </p>
        </motion.div>

        {/* Monthly Comparison Chart - IMPROVED */}
        <motion.div variants={pageItem} className="mb-6">
          <h2
            className={`section-title mb-4 ${isElderlyMode ? "text-xl" : "text-lg"}`}
          >
            Monthly Comparison
          </h2>
          <div className="card-glass rounded-3xl p-5 shadow-soft ring-1 ring-white/25">
            {/* Legend */}
            <div className="mb-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gradient-to-r from-[#5896FD] to-[#806EF8]" />
                <span className="text-sm text-foreground/55">Spending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[#3FB950]/50" />
                <span className="text-sm text-foreground/55">Budget</span>
              </div>
            </div>

            {/* Chart */}
            <div className="mb-4 flex h-40 items-end justify-between gap-3">
              {chartData.map((data, index) => {
                const isActive = index === chartData.length - 1;
                const spendingHeight = (data.amount / maxAmount) * 100;
                const budgetHeight = (data.budget / maxAmount) * 100;
                const isOverBudget = data.amount > data.budget;

                return (
                  <div
                    key={data.month}
                    className="flex h-full min-h-0 flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <div className="relative flex w-full flex-1 items-end justify-center">
                      <div
                        className="absolute w-full border-t-2 border-dashed border-[#3FB950]/50"
                        style={{ bottom: `${budgetHeight}%` }}
                        aria-hidden
                      />
                      <motion.div
                        className="w-8 max-w-full rounded-xl"
                        style={{
                          height: `${spendingHeight}%`,
                          minHeight: "15%",
                          background: isActive
                            ? "linear-gradient(180deg, #5896FD 0%, #806EF8 100%)"
                            : "linear-gradient(180deg, rgba(88, 150, 253, 0.42) 0%, rgba(128, 110, 248, 0.42) 100%)",
                          boxShadow: isActive
                            ? "0 4px 20px rgba(88, 150, 253, 0.45), inset 0 -2px 0 rgba(0,0,0,0.05)"
                            : "inset 0 1px 0 rgba(255,255,255,0.35)",
                        }}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 24,
                          delay: 0.08 * index,
                        }}
                      />
                    </div>
                    <div className="w-full text-center">
                      <span
                        className={`text-sm font-bold ${
                          isActive ? "text-brand-blue" : "text-foreground/50"
                        }`}
                      >
                        {data.month}
                      </span>
                      <p className="text-[10px] font-semibold text-foreground/50">RM {data.amount}</p>
                      <p
                        className={`text-[10px] font-medium ${
                          isOverBudget ? "text-destructive" : "text-[#3FB950]"
                        }`}
                      >
                        {isOverBudget ? "▲" : "▼"} {Math.abs(data.amount - data.budget).toFixed(0)}
                      </p>
                      {isActive && (
                        <div
                          className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full bg-[#5896FD]"
                          style={{ boxShadow: "0 0 8px #5896FD" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-brand-purple/15 pt-4">
              <div>
                <p className="text-sm text-foreground/55">Average Monthly</p>
                <p className="text-lg font-bold text-foreground">RM 1,109.88</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-brand-orange/20 px-4 py-2">
                <TrendingUp className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">RM 150 over budget</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={pageItem} className="mb-6">
          <h2
            className={`section-title mb-4 ${isElderlyMode ? "text-xl" : "text-lg"}`}
          >
            Category Breakdown
          </h2>
          <div className="card-glass overflow-hidden rounded-3xl shadow-soft">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.name}
                className={`flex cursor-pointer items-center gap-4 p-4 active:bg-brand-purple/8 ${
                  index !== categories.length - 1 ? "border-b border-brand-purple/10" : ""
                }`}
                whileTap={{ scale: 0.995 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * index }}
              >
                <div
                  className={`${isElderlyMode ? "h-14 w-14" : "h-12 w-12"} flex items-center justify-center rounded-2xl shadow-soft`}
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}35, ${cat.color}12)`,
                    boxShadow: `0 4px 14px ${cat.color}28`,
                  }}
                >
                  <cat.icon
                    className={`${isElderlyMode ? "h-7 w-7" : "h-6 w-6"}`}
                    style={{ color: cat.color }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <p className={`font-semibold text-foreground ${isElderlyMode ? "text-lg" : ""}`}>
                      {cat.name}
                    </p>
                    <p className={`font-bold text-foreground ${isElderlyMode ? "text-lg" : ""}`}>
                      RM {cat.amount}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="mr-3 h-2.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                        initial={{ width: "0%" }}
                        animate={{ width: `${cat.percent}%` }}
                        transition={{ duration: 0.55, delay: 0.08 * index, ease: "easeOut" }}
                      />
                    </div>
                    <div
                      className={`flex items-center gap-1 ${cat.isUp ? "text-destructive" : "text-[#3FB950]"}`}
                    >
                      {cat.isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      <span className="text-xs font-semibold">
                        {cat.isUp ? "+" : ""}
                        {cat.change}%
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={pageItem} className="mb-6">
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shadow-soft"
              style={{ background: "linear-gradient(135deg, #D29922 0%, #F85149 100%)" }}
            >
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <h2 className={`font-bold tracking-tight text-foreground ${isElderlyMode ? "text-xl" : "text-lg"}`}>
              Smart Insights
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            {insights.map((insight, index) => (
              <motion.button
                key={index}
                type="button"
                className="card-glass w-full rounded-2xl p-4 text-left ring-1 ring-white/20 active:bg-brand-purple/6"
                whileTap={{ scale: 0.99 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${
                      insight.type === "warning"
                        ? "bg-[#D29922]"
                        : insight.type === "success"
                          ? "bg-[#3FB950]"
                          : "bg-[#5896FD]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`mb-1 font-semibold text-foreground ${isElderlyMode ? "text-lg" : ""}`}
                    >
                      {insight.title}
                    </p>
                    <p className={`text-foreground/55 ${isElderlyMode ? "text-base" : "text-sm"}`}>
                      {insight.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-foreground/40" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

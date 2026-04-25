"use client";

import {
  ChevronLeft,
  ShoppingBag,
  Coffee,
  Plus,
  Utensils,
  Car,
  Send,
  Zap,
  Wifi,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAccessibility } from "@/context/accessibility-context";
import { useWalletData } from "@/hooks/use-wallet-data";

const pageStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};

const pageItem = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 420, damping: 32 },
  },
};

interface HistoryScreenProps {
  onBack: () => void;
  activeUserId?: number;
}

const transactions = [
  {
    id: 1,
    icon: ShoppingBag,
    name: "Grocery Store",
    category: "Shopping",
    date: "Mar 20, 2024",
    time: "2:30 PM",
    amount: -45.5,
    status: "completed",
    color: "#5896FD",
  },
  {
    id: 2,
    icon: Coffee,
    name: "Starbucks",
    category: "Food & Drink",
    date: "Mar 20, 2024",
    time: "10:15 AM",
    amount: -18.9,
    status: "completed",
    color: "#D29922",
  },
  {
    id: 3,
    icon: Plus,
    name: "Top Up from Bank",
    category: "Top Up",
    date: "Mar 19, 2024",
    time: "9:00 AM",
    amount: 500.0,
    status: "completed",
    color: "#3FB950",
  },
  {
    id: 4,
    icon: Utensils,
    name: "McDonald's",
    category: "Food & Drink",
    date: "Mar 19, 2024",
    time: "12:45 PM",
    amount: -32.0,
    status: "completed",
    color: "#F85149",
  },
  {
    id: 5,
    icon: Car,
    name: "Shell Petrol",
    category: "Transport",
    date: "Mar 18, 2024",
    time: "8:30 AM",
    amount: -120.0,
    status: "completed",
    color: "#8B949E",
  },
  {
    id: 6,
    icon: Send,
    name: "Transfer to Ahmad",
    category: "Transfer",
    date: "Mar 18, 2024",
    time: "3:00 PM",
    amount: -100.0,
    status: "completed",
    color: "#806EF8",
  },
  {
    id: 7,
    icon: Zap,
    name: "TNB Electricity",
    category: "Bills",
    date: "Mar 17, 2024",
    time: "11:00 AM",
    amount: -156.8,
    status: "completed",
    color: "#D29922",
  },
  {
    id: 8,
    icon: Plus,
    name: "Top Up from Card",
    category: "Top Up",
    date: "Mar 15, 2024",
    time: "2:00 PM",
    amount: 200.0,
    status: "completed",
    color: "#3FB950",
  },
  {
    id: 9,
    icon: Wifi,
    name: "TM Unifi",
    category: "Bills",
    date: "Mar 15, 2024",
    time: "10:00 AM",
    amount: -149.0,
    status: "completed",
    color: "#B0A4FF",
  },
];

const filters = ["All", "Income", "Expense", "Transfer", "Bills"];

export function HistoryScreen({ onBack, activeUserId }: HistoryScreenProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const { elderlyMode, t } = useAccessibility();
  const { summary } = useWalletData(activeUserId);

  const backendTransactions =
    summary?.transactions.map((tx) => {
      const amount = Number(tx.amount);
      const kind = tx.transactionType;
      const icon = kind === "RECEIVE" ? Plus : kind === "BILL_PAYMENT" ? Zap : Send;
      const category =
        kind === "RECEIVE" ? "Top Up" : kind === "BILL_PAYMENT" ? "Bills" : "Transfer";
      const dateObj = new Date(tx.transactionDate);
      return {
        id: tx.transactionId,
        icon,
        name: tx.description || kind,
        category,
        date: dateObj.toLocaleDateString(),
        time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        amount: kind === "RECEIVE" ? Math.abs(amount) : -Math.abs(amount),
        status: tx.transactionStatus.toLowerCase(),
        color: kind === "RECEIVE" ? "#3FB950" : kind === "BILL_PAYMENT" ? "#D29922" : "#806EF8",
      };
    }) ?? [];
  const sourceTransactions = backendTransactions.length > 0 ? backendTransactions : transactions;

  const filteredTransactions = sourceTransactions.filter((tx) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Income") return tx.amount > 0;
    if (activeFilter === "Expense")
      return tx.amount < 0 && tx.category !== "Transfer" && tx.category !== "Bills";
    if (activeFilter === "Transfer") return tx.category === "Transfer";
    if (activeFilter === "Bills") return tx.category === "Bills";
    return true;
  });

  const groupedTransactions = filteredTransactions.reduce(
    (groups, tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
      return groups;
    },
    {} as Record<string, typeof sourceTransactions>,
  );

  return (
    <motion.div
      className="flex min-h-screen flex-1 flex-col pb-28"
      style={{
        background:
          "linear-gradient(100deg, oklch(0.95 0.04 270) 0%, oklch(0.94 0.045 285) 45%, oklch(0.95 0.05 70) 100%)",
      }}
      initial="hidden"
      animate="show"
      variants={pageStagger}
    >
      <div className="px-5">
        <motion.div variants={pageItem} className="mb-2 flex items-center gap-4 py-4">
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
            {t("history")}
          </h1>
          <motion.button
            type="button"
            className="icon-btn-glass ml-auto flex h-12 w-12 items-center justify-center rounded-full text-foreground ring-1 ring-brand-purple/10 active:scale-90"
            whileTap={{ scale: 0.94 }}
          >
            <Filter className="h-5 w-5" />
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={pageItem}
          className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-4 scrollbar-hide"
        >
          {filters.map((filter) => {
            const active = activeFilter === filter;
            return (
              <motion.button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full font-semibold whitespace-nowrap transition-shadow ${
                  active
                    ? "text-white shadow-soft"
                    : "border border-brand-purple/18 bg-white/78 text-foreground/55 active:opacity-90"
                } ${elderlyMode ? "px-5 py-3 text-base" : "px-4 py-2 text-sm"}`}
                style={
                  active
                    ? { background: "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)" }
                    : undefined
                }
                whileTap={{ scale: 0.96 }}
              >
                {filter}
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Transactions List */}
      <div className="flex-1 overflow-auto px-5">
        {Object.entries(groupedTransactions).map(([date, txs], groupIdx) => (
          <motion.div
            key={date}
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * groupIdx, type: "spring", stiffness: 400, damping: 34 }}
          >
            <p
              className={`mb-3 inline-flex items-center rounded-full bg-white/55 px-3 py-1 font-semibold text-foreground/60 ring-1 ring-brand-purple/10 backdrop-blur-sm ${elderlyMode ? "text-base" : "text-sm"}`}
            >
              {date}
            </p>
            <div className="card-glass overflow-hidden shadow-soft ring-1 ring-white/30">
              {txs.map((tx, index) => {
                const IconComponent = tx.icon;
                return (
                  <motion.div
                    key={tx.id}
                    className={`flex items-center gap-4 p-4 active:bg-brand-purple/8 ${
                      index !== txs.length - 1 ? "border-b border-brand-purple/10" : ""
                    }`}
                    whileTap={{ scale: 0.996 }}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.02 * index,
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                  >
                    <div
                      className={`${elderlyMode ? "h-14 w-14" : "h-12 w-12"} flex shrink-0 items-center justify-center rounded-xl shadow-soft`}
                      style={{
                        background: `linear-gradient(135deg, ${tx.color}45, ${tx.color}18)`,
                        boxShadow: `0 4px 14px ${tx.color}30`,
                      }}
                    >
                      <IconComponent
                        className={`${elderlyMode ? "h-7 w-7" : "h-5 w-5"}`}
                        style={{ color: tx.color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}
                      >
                        {tx.name}
                      </p>
                      <p className={`text-foreground/50 ${elderlyMode ? "text-base" : "text-sm"}`}>
                        {tx.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${tx.amount > 0 ? "text-[#3FB950]" : "text-foreground"} ${elderlyMode ? "text-lg" : ""}`}
                      >
                        {tx.amount > 0 ? "+" : ""}RM {Math.abs(tx.amount).toFixed(2)}
                      </p>
                      <p
                        className={`capitalize text-foreground/45 ${elderlyMode ? "text-sm" : "text-xs"}`}
                      >
                        {tx.status}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

"use client";

import {
  ChevronLeft,
  Shield,
  TrendingUp,
  ChevronRight,
  Clock,
  CreditCard,
  Users,
  Wallet,
  Check,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/accessibility-context";

interface TrustScoreScreenProps {
  onBack: () => void;
}

type Step = "dashboard" | "breakdown" | "eligibility" | "apply-loan" | "loan-success";

export function TrustScoreScreen({ onBack }: TrustScoreScreenProps) {
  const [step, setStep] = useState<Step>("dashboard");
  const [loanAmount, setLoanAmount] = useState("500");
  const { elderlyMode, t } = useAccessibility();

  const trustScore = 720;
  const maxScore = 850;
  const scorePercent = (trustScore / maxScore) * 100;

  const scoreFactors = [
    { icon: Clock, label: "Payment History", score: 95, impact: "High", color: "text-[#3FB950]" },
    {
      icon: CreditCard,
      label: "Credit Utilization",
      score: 82,
      impact: "Medium",
      color: "text-[#5896FD]",
    },
    { icon: Users, label: "Account Age", score: 70, impact: "Medium", color: "text-[#D29922]" },
    {
      icon: Wallet,
      label: "Balance Stability",
      score: 88,
      impact: "High",
      color: "text-[#3FB950]",
    },
  ];

  const darkBg = "linear-gradient(180deg, #0D1117 0%, #161B22 100%)";

  // Loan Success Screen
  if (step === "loan-success") {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 pb-28 min-h-screen"
        style={{ background: darkBg }}
      >
        <div
          className={`${elderlyMode ? "w-28 h-28" : "w-20 h-20"} rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300`}
          style={{
            background: "linear-gradient(135deg, #3FB950 0%, #2EA043 100%)",
            boxShadow: "0 8px 32px rgba(63, 185, 80, 0.4)",
          }}
        >
          <Check className={`${elderlyMode ? "w-14 h-14" : "w-10 h-10"} text-white`} />
        </div>
        <h2 className={`font-bold text-[#E6EDF3] mb-2 ${elderlyMode ? "text-3xl" : "text-2xl"}`}>
          Loan Approved!
        </h2>
        <p className={`text-[#8B949E] text-center mb-2 ${elderlyMode ? "text-lg" : ""}`}>
          RM {parseFloat(loanAmount).toFixed(2)} has been credited to your wallet
        </p>
        <p className={`text-[#8B949E] text-center mb-8 ${elderlyMode ? "text-base" : "text-sm"}`}>
          Repayment due: May 15, 2024
        </p>
        <Button
          onClick={() => setStep("dashboard")}
          className={`w-full max-w-xs rounded-2xl btn-glow ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
        >
          {t("done")}
        </Button>
      </div>
    );
  }

  // Apply Loan Screen
  if (step === "apply-loan") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 min-h-screen" style={{ background: darkBg }}>
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("eligibility")}
            className="w-12 h-12 rounded-full icon-btn-glass flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-[#E6EDF3]" />
          </button>
          <h1 className={`font-semibold text-[#E6EDF3] ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Apply for Microloan
          </h1>
        </div>

        <div className="flex-1">
          <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(63, 185, 80, 0.15)" }}>
            <p className={`text-[#3FB950] ${elderlyMode ? "text-base" : "text-sm"}`}>
              Based on your Trust Score of {trustScore}, you are eligible for up to RM 1,000
              microloan.
            </p>
          </div>

          <div className="text-center mb-8">
            <p className={`text-[#8B949E] mb-2 ${elderlyMode ? "text-lg" : ""}`}>Loan Amount</p>
            <div className="flex items-center justify-center gap-1">
              <span className={`font-bold text-[#E6EDF3] ${elderlyMode ? "text-4xl" : "text-3xl"}`}>
                RM
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                className={`font-bold text-[#E6EDF3] bg-transparent border-none outline-none text-center w-40 ${elderlyMode ? "text-5xl" : "text-4xl"}`}
              />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap justify-center mb-8">
            {[200, 500, 800, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => setLoanAmount(amt.toString())}
                className={`rounded-full card-glass text-[#E6EDF3] font-medium hover:bg-white/10 transition-colors ${elderlyMode ? "px-6 py-3 text-lg" : "px-5 py-2"}`}
              >
                RM {amt}
              </button>
            ))}
          </div>

          <div className="card-glass p-4">
            <div
              className={`flex items-center justify-between py-2 ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-[#8B949E]">Interest Rate</span>
              <span className="font-medium text-[#E6EDF3]">0% (First loan)</span>
            </div>
            <div
              className={`flex items-center justify-between py-2 border-t border-[#30363D] ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-[#8B949E]">Repayment Period</span>
              <span className="font-medium text-[#E6EDF3]">30 days</span>
            </div>
            <div
              className={`flex items-center justify-between py-2 border-t border-[#30363D] ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-[#8B949E]">Total Repayment</span>
              <span className="font-bold text-[#E6EDF3]">
                RM {parseFloat(loanAmount || "0").toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("loan-success")}
            disabled={!loanAmount || parseFloat(loanAmount) <= 0 || parseFloat(loanAmount) > 1000}
            className={`w-full rounded-2xl btn-glow ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            Apply for Loan
          </Button>
        </div>
      </div>
    );
  }

  // Loan Eligibility Screen
  if (step === "eligibility") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 min-h-screen" style={{ background: darkBg }}>
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("dashboard")}
            className="w-12 h-12 rounded-full icon-btn-glass flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-[#E6EDF3]" />
          </button>
          <h1 className={`font-semibold text-[#E6EDF3] ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Loan Eligibility
          </h1>
        </div>

        <div className="flex-1">
          <div className="card-gradient-glow p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-white" />
              <div>
                <p className="text-white/70 text-sm">Your Trust Score</p>
                <p className={`font-bold text-white ${elderlyMode ? "text-3xl" : "text-2xl"}`}>
                  {trustScore}
                </p>
              </div>
            </div>
            <p className="text-sm text-white/80">
              Great score! You qualify for our microloan program.
            </p>
          </div>

          <h2
            className={`font-semibold text-[#E6EDF3] mb-4 ${elderlyMode ? "text-xl" : "text-lg"}`}
          >
            Available Options
          </h2>

          <div className="flex flex-col gap-3">
            {[
              { amount: 500, rate: "0%", period: "30 days", status: "Available" },
              { amount: 1000, rate: "2%", period: "60 days", status: "Available" },
              { amount: 2000, rate: "3%", period: "90 days", status: "Score 750+ needed" },
            ].map((option, index) => (
              <button
                key={index}
                onClick={() => option.status === "Available" && setStep("apply-loan")}
                disabled={option.status !== "Available"}
                className={`w-full p-4 card-glass text-left ${option.status === "Available" ? "hover:bg-white/5" : "opacity-60"} transition-colors`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-bold text-[#E6EDF3] ${elderlyMode ? "text-xl" : "text-lg"}`}
                  >
                    RM {option.amount.toLocaleString()}
                  </span>
                  <span
                    className={`text-sm px-2 py-1 rounded-full ${option.status === "Available" ? "bg-[#3FB950]/20 text-[#3FB950]" : "bg-[#30363D] text-[#8B949E]"}`}
                  >
                    {option.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[#8B949E] text-sm">
                  <span>Rate: {option.rate}</span>
                  <span>Period: {option.period}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Score Breakdown Screen
  if (step === "breakdown") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 min-h-screen" style={{ background: darkBg }}>
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("dashboard")}
            className="w-12 h-12 rounded-full icon-btn-glass flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5 text-[#E6EDF3]" />
          </button>
          <h1 className={`font-semibold text-[#E6EDF3] ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Score Breakdown
          </h1>
        </div>

        <div className="flex-1">
          <div className="card-glass overflow-hidden">
            {scoreFactors.map((factor, index) => (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 ${index !== scoreFactors.length - 1 ? "border-b border-[#30363D]" : ""}`}
              >
                <div
                  className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-xl flex items-center justify-center`}
                  style={{ background: "rgba(48, 54, 61, 0.8)" }}
                >
                  <factor.icon
                    className={`${elderlyMode ? "w-7 h-7" : "w-6 h-6"} text-[#E6EDF3]`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`font-medium text-[#E6EDF3] ${elderlyMode ? "text-lg" : ""}`}>
                      {factor.label}
                    </p>
                    <p className={`font-bold ${factor.color} ${elderlyMode ? "text-lg" : ""}`}>
                      {factor.score}%
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 h-2 bg-[#21262D] rounded-full mr-3 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${factor.score}%`,
                          background: "linear-gradient(135deg, #5896FD 0%, #806EF8 100%)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#8B949E]">{factor.impact} Impact</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 card-glass" style={{ borderLeft: "3px solid #5896FD" }}>
            <p className={`text-[#5896FD] font-medium mb-2 ${elderlyMode ? "text-lg" : ""}`}>
              Tips to Improve Your Score
            </p>
            <ul className={`text-[#8B949E] space-y-1 ${elderlyMode ? "text-base" : "text-sm"}`}>
              <li>• Pay bills on time to maintain payment history</li>
              <li>• Keep your wallet balance stable</li>
              <li>• Use the app regularly for transactions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Trust Score Dashboard
  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: darkBg }}>
      <div className="flex items-center gap-4 px-5 py-4">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-full icon-btn-glass flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-[#E6EDF3]" />
        </button>
        <h1 className={`font-semibold text-[#E6EDF3] ${elderlyMode ? "text-2xl" : "text-xl"}`}>
          {t("trustScore")}
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-28">
        {/* Score Card */}
        <div className="card-gradient-glow p-6 mb-6 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-white" />
          <p className="text-white/70 mb-2">Your Trust Score</p>
          <p className={`font-bold text-white mb-4 ${elderlyMode ? "text-6xl" : "text-5xl"}`}>
            {trustScore}
          </p>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-white rounded-full" style={{ width: `${scorePercent}%` }} />
          </div>
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>0</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              +12 this month
            </span>
            <span>{maxScore}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setStep("breakdown")}
            className="p-4 card-glass text-left hover:bg-white/5 transition-colors"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "rgba(88, 150, 253, 0.15)" }}
            >
              <Shield className="w-5 h-5 text-[#5896FD]" />
            </div>
            <p className={`font-medium text-[#E6EDF3] ${elderlyMode ? "text-lg" : ""}`}>
              Score Breakdown
            </p>
            <p className={`text-[#8B949E] ${elderlyMode ? "text-base" : "text-sm"}`}>
              See what affects your score
            </p>
          </button>
          <button
            onClick={() => setStep("eligibility")}
            className="p-4 card-glass text-left hover:bg-white/5 transition-colors"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "rgba(63, 185, 80, 0.15)" }}
            >
              <CreditCard className="w-5 h-5 text-[#3FB950]" />
            </div>
            <p className={`font-medium text-[#E6EDF3] ${elderlyMode ? "text-lg" : ""}`}>
              Loan Eligibility
            </p>
            <p className={`text-[#8B949E] ${elderlyMode ? "text-base" : "text-sm"}`}>
              Check available microloans
            </p>
          </button>
        </div>

        {/* Score Factors Preview */}
        <h2 className={`font-semibold text-[#E6EDF3] mb-4 ${elderlyMode ? "text-xl" : "text-lg"}`}>
          Key Factors
        </h2>
        <div className="card-glass overflow-hidden">
          {scoreFactors.slice(0, 3).map((factor, index) => (
            <button
              key={index}
              onClick={() => setStep("breakdown")}
              className={`w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors ${index !== 2 ? "border-b border-[#30363D]" : ""}`}
            >
              <div className="flex items-center gap-3">
                <factor.icon className="w-5 h-5 text-[#8B949E]" />
                <span className={`text-[#E6EDF3] ${elderlyMode ? "text-lg" : ""}`}>
                  {factor.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${factor.color}`}>{factor.score}%</span>
                <ChevronRight className="w-4 h-4 text-[#8B949E]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

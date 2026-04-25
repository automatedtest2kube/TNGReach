"use client";

import {
  ArrowLeft,
  Zap,
  Droplets,
  Wifi,
  Phone,
  Tv,
  CreditCard,
  Check,
  GraduationCap,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/accessibility-context";

interface BillsScreenProps {
  onBack: () => void;
}

type Step = "list" | "detail" | "success";

const billTypes = [
  {
    id: "electricity",
    icon: Zap,
    name: "Electricity",
    nameKey: "electricity",
    provider: "TNB",
    color: "bg-warning-light text-warning",
    gradient: "gradient-primary",
  },
  {
    id: "water",
    icon: Droplets,
    name: "Water",
    nameKey: "water",
    provider: "Air Selangor",
    color: "bg-primary-light text-primary",
    gradient: "gradient-secondary",
  },
  {
    id: "internet",
    icon: Wifi,
    name: "Internet",
    nameKey: "internet",
    provider: "TM / Unifi",
    color: "bg-accent-light text-accent",
    gradient: "gradient-primary",
  },
  {
    id: "mobile",
    icon: Phone,
    name: "Mobile",
    nameKey: "mobile",
    provider: "All Providers",
    color: "bg-success-light text-success",
    gradient: "gradient-secondary",
  },
  {
    id: "tv",
    icon: Tv,
    name: "Astro / TV",
    nameKey: "tv",
    provider: "Astro",
    color: "bg-danger-light text-danger",
    gradient: "gradient-primary",
  },
  {
    id: "credit",
    icon: CreditCard,
    name: "Credit Card",
    nameKey: "creditCard",
    provider: "All Banks",
    color: "bg-secondary-light text-secondary",
    gradient: "gradient-secondary",
  },
  {
    id: "insurance",
    icon: Shield,
    name: "Insurance",
    nameKey: "insurance",
    provider: "All Providers",
    color: "bg-primary-light text-primary",
    gradient: "gradient-primary",
  },
  {
    id: "education",
    icon: GraduationCap,
    name: "Education",
    nameKey: "education",
    provider: "Schools / Unis",
    color: "bg-accent-light text-accent",
    gradient: "gradient-secondary",
  },
];

export function BillsScreen({ onBack }: BillsScreenProps) {
  const [step, setStep] = useState<Step>("list");
  const [selectedBill, setSelectedBill] = useState<(typeof billTypes)[0] | null>(null);
  const [accountNumber, setAccountNumber] = useState("1234-5678-9012");
  const { elderlyMode, t } = useAccessibility();
  const amount = 156.8;

  // Success Screen
  if (step === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28 bg-background">
        <div
          className={`${elderlyMode ? "w-28 h-28" : "w-20 h-20"} rounded-full bg-success flex items-center justify-center mb-6 animate-in zoom-in duration-300`}
        >
          <Check className={`${elderlyMode ? "w-14 h-14" : "w-10 h-10"} text-primary-foreground`} />
        </div>
        <h2 className={`font-bold text-foreground mb-2 ${elderlyMode ? "text-3xl" : "text-2xl"}`}>
          Bill Paid!
        </h2>
        <p className={`text-muted-foreground text-center mb-2 ${elderlyMode ? "text-lg" : ""}`}>
          RM {amount.toFixed(2)} paid for {selectedBill?.name}
        </p>
        <p className={`text-muted-foreground mb-8 ${elderlyMode ? "text-base" : "text-sm"}`}>
          Account: {accountNumber}
        </p>
        <Button
          onClick={onBack}
          className={`w-full max-w-xs rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
        >
          {t("done")}
        </Button>
      </div>
    );
  }

  // Bill Detail Screen
  if (step === "detail" && selectedBill) {
    const IconComponent = selectedBill.icon;
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("list")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            {selectedBill.name} Bill
          </h1>
        </div>

        <div className="flex-1">
          <div className="flex flex-col items-center py-6 mb-4">
            <div
              className={`${elderlyMode ? "w-20 h-20" : "w-16 h-16"} rounded-2xl ${selectedBill.gradient} flex items-center justify-center mb-3`}
            >
              <IconComponent
                className={`${elderlyMode ? "w-10 h-10" : "w-8 h-8"} text-primary-foreground`}
              />
            </div>
            <p className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : ""}`}>
              {selectedBill.provider}
            </p>
          </div>

          <div className="mb-6">
            <label
              className={`text-muted-foreground mb-2 block ${elderlyMode ? "text-base" : "text-sm"}`}
            >
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className={`w-full px-4 rounded-2xl bg-card text-foreground outline-none focus:ring-2 focus:ring-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
            />
          </div>

          <div className="bg-card rounded-2xl p-4">
            <div
              className={`flex items-center justify-between py-3 ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-muted-foreground">Bill Period</span>
              <span className="font-medium text-foreground">March 2024</span>
            </div>
            <div
              className={`flex items-center justify-between py-3 border-t border-border ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium text-foreground">Apr 15, 2024</span>
            </div>
            <div
              className={`flex items-center justify-between py-3 border-t border-border ${elderlyMode ? "text-xl" : "text-lg"}`}
            >
              <span className="text-muted-foreground">Amount Due</span>
              <span className="font-bold text-foreground">RM {amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("success")}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            Pay RM {amount.toFixed(2)}
          </Button>
        </div>
      </div>
    );
  }

  // Bill Types List
  return (
    <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
      <div className="flex items-center gap-4 py-4 mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
          {t("payBills")}
        </h1>
      </div>

      <p className={`text-muted-foreground mb-4 ${elderlyMode ? "text-lg" : ""}`}>
        Select a bill category to pay
      </p>

      <div className={`grid gap-3 ${elderlyMode ? "grid-cols-2" : "grid-cols-2"}`}>
        {billTypes.slice(0, elderlyMode ? 6 : 8).map((bill) => {
          const IconComponent = bill.icon;
          return (
            <button
              key={bill.id}
              onClick={() => {
                setSelectedBill(bill);
                setStep("detail");
              }}
              className={`flex flex-col items-center gap-3 bg-card rounded-2xl hover:shadow-md transition-shadow ${elderlyMode ? "p-6" : "p-5"}`}
            >
              <div
                className={`${elderlyMode ? "w-16 h-16" : "w-14 h-14"} rounded-xl ${bill.gradient} flex items-center justify-center`}
              >
                <IconComponent
                  className={`${elderlyMode ? "w-8 h-8" : "w-7 h-7"} text-primary-foreground`}
                />
              </div>
              <div className="text-center">
                <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                  {bill.name}
                </p>
                <p className={`text-muted-foreground ${elderlyMode ? "text-sm" : "text-xs"}`}>
                  {bill.provider}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

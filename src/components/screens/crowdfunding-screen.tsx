"use client";

import {
  ArrowLeft,
  Heart,
  Users,
  Target,
  ChevronRight,
  Plus,
  Check,
  FileText,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/accessibility-context";

interface CrowdfundingScreenProps {
  onBack: () => void;
}

type Step =
  | "home"
  | "pool-detail"
  | "donate"
  | "donate-success"
  | "apply"
  | "apply-upload"
  | "apply-status";

const fundingPools = [
  {
    id: 1,
    title: "Medical Fund for Pak Cik Ahmad",
    description: "Help with hospital bills after heart surgery",
    raised: 12500,
    goal: 20000,
    donors: 156,
    daysLeft: 12,
    image: "MA",
  },
  {
    id: 2,
    title: "Education for Orang Asli Children",
    description: "Provide school supplies and uniforms",
    raised: 8200,
    goal: 10000,
    donors: 89,
    daysLeft: 25,
    image: "OA",
  },
  {
    id: 3,
    title: "Flood Relief - Kelantan",
    description: "Emergency supplies for affected families",
    raised: 45000,
    goal: 50000,
    donors: 523,
    daysLeft: 5,
    image: "FR",
  },
];

export function CrowdfundingScreen({ onBack }: CrowdfundingScreenProps) {
  const [step, setStep] = useState<Step>("home");
  const [selectedPool, setSelectedPool] = useState<(typeof fundingPools)[0] | null>(null);
  const [donateAmount, setDonateAmount] = useState("");
  const { elderlyMode, t } = useAccessibility();

  // Donate Success Screen
  if (step === "donate-success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28 bg-background">
        <div
          className={`${elderlyMode ? "w-28 h-28" : "w-20 h-20"} rounded-full bg-success flex items-center justify-center mb-6 animate-in zoom-in duration-300`}
        >
          <Heart className={`${elderlyMode ? "w-14 h-14" : "w-10 h-10"} text-primary-foreground`} />
        </div>
        <h2 className={`font-bold text-foreground mb-2 ${elderlyMode ? "text-3xl" : "text-2xl"}`}>
          Thank You!
        </h2>
        <p className={`text-muted-foreground text-center mb-2 ${elderlyMode ? "text-lg" : ""}`}>
          Your donation of RM {parseFloat(donateAmount).toFixed(2)} has been sent to
        </p>
        <p
          className={`font-semibold text-foreground mb-8 text-center ${elderlyMode ? "text-xl" : ""}`}
        >
          {selectedPool?.title}
        </p>
        <Button
          onClick={() => setStep("home")}
          className={`w-full max-w-xs rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
        >
          {t("done")}
        </Button>
      </div>
    );
  }

  // Donate Flow
  if (step === "donate" && selectedPool) {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("pool-detail")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Donate
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <p className={`text-muted-foreground mb-2 ${elderlyMode ? "text-lg" : ""}`}>
            Enter donation amount
          </p>
          <div className="flex items-center justify-center gap-1 mb-8">
            <span className={`font-bold text-foreground ${elderlyMode ? "text-4xl" : "text-3xl"}`}>
              RM
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={donateAmount}
              onChange={(e) => setDonateAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className={`font-bold text-foreground bg-transparent border-none outline-none text-center w-48 ${elderlyMode ? "text-6xl" : "text-5xl"}`}
            />
          </div>

          <div className="flex gap-3 flex-wrap justify-center">
            {[10, 20, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => setDonateAmount(amt.toString())}
                className={`rounded-full bg-card text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors ${elderlyMode ? "px-6 py-3 text-lg" : "px-5 py-2"}`}
              >
                RM {amt}
              </button>
            ))}
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("donate-success")}
            disabled={!donateAmount || parseFloat(donateAmount) <= 0}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            <Heart className="w-5 h-5 mr-2" />
            Donate Now
          </Button>
        </div>
      </div>
    );
  }

  // Pool Detail Screen
  if (step === "pool-detail" && selectedPool) {
    const progress = (selectedPool.raised / selectedPool.goal) * 100;
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("home")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Campaign Details
          </h1>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="w-full h-40 rounded-2xl gradient-secondary flex items-center justify-center text-primary-foreground text-4xl font-bold mb-4">
            {selectedPool.image}
          </div>

          <h2 className={`font-bold text-foreground mb-2 ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            {selectedPool.title}
          </h2>
          <p className={`text-muted-foreground mb-4 ${elderlyMode ? "text-lg" : ""}`}>
            {selectedPool.description}
          </p>

          <div className="bg-card rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold text-primary ${elderlyMode ? "text-2xl" : "text-xl"}`}>
                RM {selectedPool.raised.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                of RM {selectedPool.goal.toLocaleString()}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
              <div
                className="h-full gradient-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{selectedPool.donors} donors</span>
              </div>
              <span className="text-muted-foreground">{selectedPool.daysLeft} days left</span>
            </div>
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("donate")}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            <Heart className="w-5 h-5 mr-2" />
            Donate to This Campaign
          </Button>
        </div>
      </div>
    );
  }

  // Apply Status Screen
  if (step === "apply-status") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("home")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Application Status
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-warning-light flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-warning" />
          </div>
          <h2 className={`font-bold text-foreground mb-2 ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Under Review
          </h2>
          <p
            className={`text-muted-foreground text-center max-w-xs ${elderlyMode ? "text-lg" : ""}`}
          >
            Your application is being reviewed. We will notify you within 3-5 business days.
          </p>

          <div className="w-full bg-card rounded-2xl p-4 mt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-foreground">Application Submitted</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              </div>
              <span className="text-foreground">Under Review</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              </div>
              <span className="text-muted-foreground">Decision</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Apply Upload Screen
  if (step === "apply-upload") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("apply")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Upload Documents
          </h1>
        </div>

        <div className="flex-1">
          <p className={`text-muted-foreground mb-6 ${elderlyMode ? "text-lg" : ""}`}>
            Please upload supporting documents for your application
          </p>

          <div className="flex flex-col gap-4">
            {["IC / Passport", "Proof of Income", "Medical Documents (if applicable)"].map(
              (doc, index) => (
                <button
                  key={index}
                  className="w-full p-4 bg-card rounded-2xl border-2 border-dashed border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-left">
                      <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                        {doc}
                      </p>
                      <p className="text-sm text-muted-foreground">Tap to upload</p>
                    </div>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("apply-status")}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            Submit Application
          </Button>
        </div>
      </div>
    );
  }

  // Apply for Help Screen
  if (step === "apply") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("home")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Apply for Help
          </h1>
        </div>

        <div className="flex-1">
          <div className="bg-primary-light rounded-2xl p-4 mb-6">
            <p className={`text-primary ${elderlyMode ? "text-base" : "text-sm"}`}>
              If you are facing financial difficulties, you can apply for community support. All
              applications are reviewed within 3-5 business days.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label
                className={`text-muted-foreground mb-2 block ${elderlyMode ? "text-base" : "text-sm"}`}
              >
                Reason for Application
              </label>
              <select
                className={`w-full px-4 rounded-2xl bg-card text-foreground outline-none focus:ring-2 focus:ring-primary ${elderlyMode ? "h-14 text-lg" : "h-12"}`}
              >
                <option>Medical Emergency</option>
                <option>Education Support</option>
                <option>Natural Disaster</option>
                <option>Job Loss</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label
                className={`text-muted-foreground mb-2 block ${elderlyMode ? "text-base" : "text-sm"}`}
              >
                Amount Needed (RM)
              </label>
              <input
                type="text"
                placeholder="Enter amount"
                className={`w-full px-4 rounded-2xl bg-card text-foreground outline-none focus:ring-2 focus:ring-primary ${elderlyMode ? "h-14 text-lg" : "h-12"}`}
              />
            </div>
            <div>
              <label
                className={`text-muted-foreground mb-2 block ${elderlyMode ? "text-base" : "text-sm"}`}
              >
                Brief Description
              </label>
              <textarea
                placeholder="Describe your situation..."
                rows={4}
                className={`w-full px-4 py-3 rounded-2xl bg-card text-foreground outline-none focus:ring-2 focus:ring-primary resize-none ${elderlyMode ? "text-lg" : ""}`}
              />
            </div>
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("apply-upload")}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            {t("next")}
          </Button>
        </div>
      </div>
    );
  }

  // Crowdfunding Home
  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex items-center gap-4 px-5 py-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
          {t("crowdfunding")}
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-28">
        {/* Apply for Help */}
        <button
          onClick={() => setStep("apply")}
          className="w-full p-4 bg-accent-light rounded-2xl flex items-center gap-4 mb-6"
        >
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
            <Plus className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="text-left">
            <p className={`font-semibold text-foreground ${elderlyMode ? "text-lg" : ""}`}>
              Need Help?
            </p>
            <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
              Apply for community support
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
        </button>

        {/* Funding Pools */}
        <h2 className={`font-semibold text-foreground mb-4 ${elderlyMode ? "text-xl" : "text-lg"}`}>
          Active Campaigns
        </h2>
        <div className="flex flex-col gap-4">
          {fundingPools.map((pool) => {
            const progress = (pool.raised / pool.goal) * 100;
            return (
              <button
                key={pool.id}
                onClick={() => {
                  setSelectedPool(pool);
                  setStep("pool-detail");
                }}
                className="w-full bg-card rounded-2xl p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 mb-3">
                  <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                    {pool.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold text-foreground truncate ${elderlyMode ? "text-lg" : ""}`}
                    >
                      {pool.title}
                    </p>
                    <p
                      className={`text-muted-foreground truncate ${elderlyMode ? "text-base" : "text-sm"}`}
                    >
                      {pool.description}
                    </p>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full gradient-primary rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>RM {pool.raised.toLocaleString()} raised</span>
                  <span>{pool.daysLeft} days left</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowLeft, Search, Check, AlertTriangle, Shield, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/accessibility-context";
import { fetchUsers, transferMoney, type UserListItem } from "@/lib/api/wallet";

interface SendMoneyScreenProps {
  onBack: () => void;
  activeUserId: number;
  onTransferSuccess?: () => void;
}

type Step = "recipient" | "amount" | "confirm" | "highAmount" | "familyApproval" | "success";

type Contact = {
  id: number;
  name: string;
  phone: string;
  avatar: string;
  color: string;
};

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]?.slice(0, 1).toUpperCase() ?? "U";
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

const avatarColors = ["bg-primary", "bg-accent", "bg-secondary"];

function toContact(item: UserListItem, idx: number): Contact {
  return {
    id: item.userId,
    name: item.fullName,
    phone: item.phoneNumber || item.email || "No phone",
    avatar: initials(item.fullName),
    color: avatarColors[idx % avatarColors.length] ?? "bg-primary",
  };
}

export function SendMoneyScreen({ onBack, activeUserId, onTransferSuccess }: SendMoneyScreenProps) {
  const [step, setStep] = useState<Step>("recipient");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { elderlyMode, t } = useAccessibility();

  useEffect(() => {
    let alive = true;
    setLoadingContacts(true);
    fetchUsers(200)
      .then((items) => {
        if (!alive) return;
        const mapped = items
          .filter((u) => u.userId !== activeUserId)
          .map((u, idx) => toContact(u, idx));
        setContacts(mapped);
        setContactsError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setContacts([]);
        setContactsError(err instanceof Error ? err.message : "Failed to load recipients");
      })
      .finally(() => {
        if (alive) setLoadingContacts(false);
      });
    return () => {
      alive = false;
    };
  }, [activeUserId]);

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery),
      ),
    [contacts, searchQuery],
  );

  const handleAmountInput = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    if (numericValue.split(".").length <= 2) {
      setAmount(numericValue);
    }
  };

  const handleContinueFromAmount = () => {
    setTransferError(null);
    const parsedAmount = parseFloat(amount);
    if (parsedAmount >= 500) {
      setStep("highAmount");
    } else {
      setStep("confirm");
    }
  };

  const quickAmounts = elderlyMode ? [50, 100, 200, 500] : [10, 20, 50, 100];

  const submitTransfer = async () => {
    if (!selectedContact) return;
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    setIsSubmitting(true);
    setTransferError(null);
    try {
      await transferMoney({
        senderId: activeUserId,
        receiverId: selectedContact.id,
        amount: parsedAmount,
        description: `Transfer to ${selectedContact.name}`,
      });
      onTransferSuccess?.();
      setStep("success");
    } catch (err) {
      setTransferError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {t("success")}!
        </h2>
        <p className={`text-muted-foreground text-center mb-2 ${elderlyMode ? "text-lg" : ""}`}>
          RM {parseFloat(amount).toFixed(2)} has been sent to
        </p>
        <p className={`font-semibold text-foreground mb-8 ${elderlyMode ? "text-xl" : ""}`}>
          {selectedContact?.name}
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

  // Family Approval Screen
  if (step === "familyApproval") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("highAmount")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Family Approval
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-secondary-light flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-secondary" />
          </div>
          <h2
            className={`font-bold text-foreground mb-2 text-center ${elderlyMode ? "text-2xl" : "text-xl"}`}
          >
            Waiting for Approval
          </h2>
          <p className={`text-muted-foreground text-center mb-8 ${elderlyMode ? "text-lg" : ""}`}>
            A notification has been sent to your linked family member for approval.
          </p>

          <div className="w-full max-w-sm bg-card rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-foreground">Guardian: Aminah Rahman</p>
                <p className="text-sm text-muted-foreground">Pending approval...</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
            <span className="text-sm">Usually responds within 5 minutes</span>
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => void submitTransfer()}
            disabled={isSubmitting}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            {isSubmitting ? "Processing..." : "Confirm & Send"}
          </Button>
          <Button
            onClick={() => setStep("confirm")}
            variant="ghost"
            className="w-full h-12 mt-2 text-muted-foreground"
          >
            {t("cancel")}
          </Button>
        </div>
      </div>
    );
  }

  // High Amount Alert Screen
  if (step === "highAmount") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("amount")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Confirm Large Amount
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-warning-light flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-warning" />
          </div>
          <h2
            className={`font-bold text-foreground mb-2 text-center ${elderlyMode ? "text-2xl" : "text-xl"}`}
          >
            Large Amount Detected
          </h2>
          <p className={`text-muted-foreground text-center mb-4 ${elderlyMode ? "text-lg" : ""}`}>
            You are about to send a large amount:
          </p>
          <p className={`font-bold text-foreground mb-6 ${elderlyMode ? "text-4xl" : "text-3xl"}`}>
            RM {parseFloat(amount).toFixed(2)}
          </p>
          <p
            className={`text-muted-foreground text-center max-w-xs ${elderlyMode ? "text-base" : "text-sm"}`}
          >
            For your safety, please confirm this transaction or request family approval.
          </p>
        </div>

        <div className="py-4 flex flex-col gap-3">
          <Button
            onClick={() => setStep("confirm")}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            I Confirm This Amount
          </Button>
          {elderlyMode && (
            <Button
              onClick={() => setStep("familyApproval")}
              variant="outline"
              className="w-full h-14 rounded-2xl border-2 border-secondary text-secondary"
            >
              Request Family Approval
            </Button>
          )}
          <Button
            onClick={() => setStep("amount")}
            variant="ghost"
            className="w-full h-12 text-muted-foreground"
          >
            Go Back & Edit
          </Button>
        </div>
      </div>
    );
  }

  // Confirm Screen
  if (step === "confirm") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("amount")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            {t("confirm")} {t("payment")}
          </h1>
        </div>

        <div className="flex-1">
          <div className="flex flex-col items-center py-8">
            <div
              className={`${elderlyMode ? "w-24 h-24" : "w-20 h-20"} rounded-full ${selectedContact?.color} flex items-center justify-center text-primary-foreground font-bold mb-4 ${elderlyMode ? "text-3xl" : "text-2xl"}`}
            >
              {selectedContact?.avatar}
            </div>
            <p className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : "text-lg"}`}>
              {selectedContact?.name}
            </p>
            <p className={`text-muted-foreground ${elderlyMode ? "text-base" : ""}`}>
              {selectedContact?.phone}
            </p>
          </div>

          <div className="bg-card rounded-2xl p-4">
            <div
              className={`flex items-center justify-between py-3 ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold text-foreground">
                RM {parseFloat(amount).toFixed(2)}
              </span>
            </div>
            <div
              className={`flex items-center justify-between py-3 border-t border-border ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-muted-foreground">Fee</span>
              <span className="font-semibold text-success">Free</span>
            </div>
            <div
              className={`flex items-center justify-between py-3 border-t border-border ${elderlyMode ? "text-xl" : "text-lg"}`}
            >
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">RM {parseFloat(amount).toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="py-4">
          {transferError && (
            <p className="mb-3 rounded-xl border border-red-300/60 bg-red-100/70 px-3 py-2 text-sm text-red-700">
              {transferError}
            </p>
          )}
          <Button
            onClick={() => void submitTransfer()}
            disabled={isSubmitting}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            {isSubmitting ? "Sending..." : `${t("confirm")} & ${t("send")}`}
          </Button>
        </div>
      </div>
    );
  }

  // Amount Screen
  if (step === "amount") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("recipient")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            {t("enterAmount")}
          </h1>
        </div>

        <div className="flex items-center gap-3 mb-6 bg-card rounded-2xl p-4">
          <div
            className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-full ${selectedContact?.color} flex items-center justify-center text-primary-foreground font-bold`}
          >
            {selectedContact?.avatar}
          </div>
          <div>
            <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
              {selectedContact?.name}
            </p>
            <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
              {selectedContact?.phone}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <p className={`text-muted-foreground mb-2 ${elderlyMode ? "text-lg" : ""}`}>
              Amount to send
            </p>
            <div className="flex items-center justify-center gap-1">
              <span
                className={`font-bold text-foreground ${elderlyMode ? "text-4xl" : "text-3xl"}`}
              >
                RM
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountInput(e.target.value)}
                placeholder="0.00"
                className={`font-bold text-foreground bg-transparent border-none outline-none text-center w-48 ${elderlyMode ? "text-6xl" : "text-5xl"}`}
              />
            </div>
          </div>

          <div className={`flex gap-3 flex-wrap justify-center ${elderlyMode ? "gap-4" : ""}`}>
            {quickAmounts.map((qa) => (
              <button
                key={qa}
                onClick={() => setAmount(qa.toString())}
                className={`rounded-full bg-card text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-colors ${elderlyMode ? "px-6 py-3 text-lg" : "px-5 py-2"}`}
              >
                RM {qa}
              </button>
            ))}
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={handleContinueFromAmount}
            disabled={!amount || parseFloat(amount) <= 0}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            {t("next")}
          </Button>
        </div>
      </div>
    );
  }

  // Recipient Selection Screen
  return (
    <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
      <div className="flex items-center gap-4 py-4 mb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
          {t("sendMoney")}
        </h1>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search name or phone number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-12 pr-4 rounded-2xl bg-card text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary ${elderlyMode ? "h-14 text-lg" : "h-12"}`}
        />
      </div>

      <p
        className={`font-medium text-muted-foreground mb-3 ${elderlyMode ? "text-base" : "text-sm"}`}
      >
        {t("selectRecipient")}
      </p>

      <div className="flex-1 overflow-auto">
        {loadingContacts ? (
          <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">Loading recipients...</div>
        ) : contactsError ? (
          <div className="rounded-2xl border border-red-300/60 bg-red-100/70 p-4 text-sm text-red-700">
            {contactsError}
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">No recipients found.</div>
        ) : (
          <div className="bg-card rounded-2xl overflow-hidden">
            {filteredContacts.map((contact, index) => (
              <button
                key={contact.id}
                onClick={() => {
                  setSelectedContact(contact);
                  setStep("amount");
                }}
                className={`w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${index !== filteredContacts.length - 1 ? "border-b border-border" : ""}`}
              >
                <div
                  className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-full ${contact.color} flex items-center justify-center text-primary-foreground font-bold flex-shrink-0`}
                >
                  {contact.avatar}
                </div>
                <div className="text-left">
                  <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                    {contact.name}
                  </p>
                  <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
                    {contact.phone}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

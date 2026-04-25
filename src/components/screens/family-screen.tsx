"use client";

import {
  ArrowLeft,
  Users,
  Plus,
  Shield,
  Bell,
  Check,
  X,
  ChevronRight,
  Settings,
  Eye,
  Clock,
  QrCode,
  MessageCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/context/accessibility-context";
import { FALLBACK_USER_PROFILE, fetchUserProfile } from "@/lib/user-profile";
import {
  createFamilyInviteQrValue,
  createFamilyInvitePayload,
  getFamilyMembers,
  parseFamilyInvitePayload,
  registerFamilyInvite,
  setLatestFamilyInvitePayload,
  type FamilyMember,
} from "@/lib/family-link";
import QRCode from "qrcode";

interface FamilyScreenProps {
  onBack: () => void;
  onNavigate?: (screen: string) => void;
  activeUserId?: number;
}

type Step = "dashboard" | "requests" | "monitoring" | "permissions";

const pendingRequests = [
  {
    id: 1,
    name: "Ali Ibrahim",
    relation: "Uncle",
    avatar: "AI",
    message: "Wants to link as your guardian",
  },
];

const recentActivity = [
  { id: 1, member: "Aminah Rahman", action: "Approved RM 500 transfer", time: "2 hours ago" },
  { id: 2, member: "Hassan Rahman", action: "Viewed your spending report", time: "Yesterday" },
  { id: 3, member: "Aminah Rahman", action: "Set spending limit to RM 1000", time: "2 days ago" },
];

export function FamilyScreen({ onBack, onNavigate, activeUserId }: FamilyScreenProps) {
  const [step, setStep] = useState<Step>("dashboard");
  const [profile, setProfile] = useState(FALLBACK_USER_PROFILE);
  const [linkedMembers, setLinkedMembers] = useState<FamilyMember[]>([]);
  const [showLinkQrModal, setShowLinkQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const { elderlyMode, t } = useAccessibility();
  const linkPayload = useMemo(
    () => createFamilyInvitePayload(profile.fullName, profile.phone),
    [profile.fullName, profile.phone],
  );

  useEffect(() => {
    setLatestFamilyInvitePayload(linkPayload);
  }, [linkPayload]);

  useEffect(() => {
    let alive = true;
    fetchUserProfile(activeUserId)
      .then((data) => {
        if (alive) setProfile(data);
      })
      .catch(() => {
        // Keep fallback values when API is unavailable.
      });
    return () => {
      alive = false;
    };
  }, [activeUserId]);

  useEffect(() => {
    setLinkedMembers(getFamilyMembers());
  }, []);

  useEffect(() => {
    if (!showLinkQrModal) return;
    const parsed = parseFamilyInvitePayload(linkPayload);
    const code = parsed?.inviteCode ?? "";
    setInviteCode(code);
    QRCode.toDataURL(createFamilyInviteQrValue(code), {
      margin: 1,
      width: 300,
      color: { dark: "#2D225A", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [linkPayload, showLinkQrModal]);

  useEffect(() => {
    const parsed = parseFamilyInvitePayload(linkPayload);
    if (!parsed?.inviteCode) return;
    // Seed invite registry for current mock flow.
    registerFamilyInvite(parsed.inviteCode, linkPayload);
  }, [linkPayload]);

  const handleShareToWhatsApp = () => {
    const message =
      `TNG Reach family link invite from ${profile.fullName}\n\n` +
      `Invite code: ${inviteCode}\n\n` +
      `Open TNG Reach > Scan & Pay > Scan Family QR > Enter Invite Code.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Permissions Screen
  if (step === "permissions") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("dashboard")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Permission Settings
          </h1>
        </div>

        <div className="flex-1">
          <p className={`text-muted-foreground mb-6 ${elderlyMode ? "text-lg" : ""}`}>
            Control what linked family members can do with your account
          </p>

          <div className="bg-card rounded-2xl overflow-hidden">
            {[
              { label: "View Transaction History", enabled: true },
              { label: "View Spending Reports", enabled: true },
              { label: "Approve Large Transfers", enabled: true },
              { label: "Set Spending Limits", enabled: false },
              { label: "Block Transactions", enabled: false },
              { label: "Receive Activity Alerts", enabled: true },
            ].map((permission, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 ${index !== 5 ? "border-b border-border" : ""}`}
              >
                <span className={`text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                  {permission.label}
                </span>
                <Switch defaultChecked={permission.enabled} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Transaction Monitoring Screen
  if (step === "monitoring") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("dashboard")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Activity Log
          </h1>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 bg-card rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                      {activity.member}
                    </p>
                    <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
                      {activity.action}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{activity.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Approval Requests Screen
  if (step === "requests") {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("dashboard")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Pending Requests
          </h1>
        </div>

        <div className="flex-1">
          {pendingRequests.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 bg-card rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold">
                      {request.avatar}
                    </div>
                    <div>
                      <p
                        className={`font-semibold text-foreground ${elderlyMode ? "text-lg" : ""}`}
                      >
                        {request.name}
                      </p>
                      <p
                        className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}
                      >
                        {request.relation}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-muted-foreground mb-4 ${elderlyMode ? "text-base" : "text-sm"}`}
                  >
                    {request.message}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className={`flex-1 rounded-xl ${elderlyMode ? "h-12" : "h-10"}`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      className={`flex-1 rounded-xl gradient-primary ${elderlyMode ? "h-12" : "h-10"}`}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No pending requests</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Family Dashboard
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
          {t("familyModule")}
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-28">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setStep("requests")}
            className="p-4 bg-card rounded-2xl text-left hover:shadow-md transition-shadow relative"
          >
            {pendingRequests.length > 0 && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-danger flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-bold">
                  {pendingRequests.length}
                </span>
              </div>
            )}
            <Bell className="w-6 h-6 text-primary mb-2" />
            <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
              Requests
            </p>
          </button>
          <button
            onClick={() => setStep("permissions")}
            className="p-4 bg-card rounded-2xl text-left hover:shadow-md transition-shadow"
          >
            <Settings className="w-6 h-6 text-accent mb-2" />
            <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
              Permissions
            </p>
          </button>
          <button
            onClick={() => onNavigate?.("family-scan")}
            className="p-4 bg-card rounded-2xl text-left hover:shadow-md transition-shadow"
          >
            <QrCode className="w-6 h-6 text-brand-blue mb-2" />
            <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
              Family Scan
            </p>
          </button>
        </div>

        {/* Linked Members */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : "text-lg"}`}>
              Linked Members
            </h2>
            <button
              onClick={() => setShowLinkQrModal(true)}
              className="flex items-center gap-1 text-primary"
            >
              <Plus className="w-4 h-4" />
              <span className={`font-medium ${elderlyMode ? "text-base" : "text-sm"}`}>Add</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {linkedMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-4 p-4 bg-card rounded-2xl">
                <div
                  className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold`}
                >
                  {member.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                    {member.name}
                  </p>
                  <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
                    {member.relation}
                  </p>
                </div>
                <div
                  className={`px-2 py-1 rounded-full ${member.status === "active" ? "bg-success-light" : "bg-warning-light"}`}
                >
                  <span
                    className={`text-xs font-medium ${member.status === "active" ? "text-success" : "text-warning"}`}
                  >
                    {member.status === "active" ? "Active" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : "text-lg"}`}>
              Recent Activity
            </h2>
            <button
              onClick={() => setStep("monitoring")}
              className={`text-primary font-medium ${elderlyMode ? "text-base" : "text-sm"}`}
            >
              See All
            </button>
          </div>

          <div className="bg-card rounded-2xl overflow-hidden">
            {recentActivity.slice(0, 2).map((activity, index) => (
              <button
                key={activity.id}
                onClick={() => setStep("monitoring")}
                className={`w-full flex items-center justify-between p-4 text-left ${index !== 1 ? "border-b border-border" : ""}`}
              >
                <div>
                  <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                    {activity.action}
                  </p>
                  <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
                    {activity.member} - {activity.time}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {showLinkQrModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">Link Family Member</h3>
              <button
                type="button"
                onClick={() => setShowLinkQrModal(false)}
                className="rounded-full p-2 text-foreground/55 hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-3 text-sm text-foreground/60">
              Ask your family member to scan this QR in TNG Reach scanner to link account access.
            </p>
            <div className="mb-3 rounded-xl border border-brand-purple/25 bg-brand-purple/5 px-3 py-2 text-center">
              <p className="text-xs text-foreground/60">Invite Code</p>
              <p className="text-base font-extrabold tracking-[0.12em] text-brand-purple">{inviteCode}</p>
            </div>
            <div className="flex justify-center rounded-2xl border border-brand-purple/20 bg-muted/30 p-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Family link QR code" className="h-56 w-56 rounded-xl bg-white p-2" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-foreground/50">
                  <QrCode className="h-8 w-8 animate-pulse" />
                </div>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setShowLinkQrModal(false)}
                className="rounded-xl border border-brand-purple/30 bg-white px-4 py-3 text-sm font-semibold text-brand-purple"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

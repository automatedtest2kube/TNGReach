"use client";

import {
  ArrowLeft,
  Bell,
  BellRing,
  Clock,
  Calendar,
  ChevronRight,
  Plus,
  Zap,
  Droplets,
  CreditCard,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAccessibility } from "@/context/accessibility-context";

interface RemindersScreenProps {
  onBack: () => void;
}

export function RemindersScreen({ onBack }: RemindersScreenProps) {
  const { elderlyMode } = useAccessibility();
  const [smartReminders, setSmartReminders] = useState(true);

  const upcomingReminders = [
    {
      id: 1,
      icon: Zap,
      title: "Electricity Bill Due",
      description: "TNB - RM 156.80",
      date: "Apr 15, 2024",
      daysLeft: 3,
      color: "bg-warning",
    },
    {
      id: 2,
      icon: Droplets,
      title: "Water Bill Due",
      description: "Air Selangor - RM 45.20",
      date: "Apr 20, 2024",
      daysLeft: 8,
      color: "bg-primary",
    },
    {
      id: 3,
      icon: CreditCard,
      title: "Credit Card Payment",
      description: "Maybank - RM 1,250.00",
      date: "Apr 25, 2024",
      daysLeft: 13,
      color: "bg-accent",
    },
  ];

  const recurringBehaviors = [
    {
      title: "Weekly Grocery Shopping",
      description: "Usually on Saturdays, ~RM 150",
      enabled: true,
    },
    {
      title: "Monthly Utility Payments",
      description: "Around 15th of each month",
      enabled: true,
    },
    {
      title: "Daily Coffee Purchase",
      description: "Average RM 8-12 per day",
      enabled: false,
    },
  ];

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
          Smart Reminders
        </h1>
      </div>

      <div className="flex-1 overflow-auto px-5 pb-28">
        {/* Smart Reminders Toggle */}
        <div className="bg-card rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <BellRing className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className={`font-semibold text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                  Smart Reminders
                </p>
                <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
                  AI-powered payment reminders
                </p>
              </div>
            </div>
            <Switch checked={smartReminders} onCheckedChange={setSmartReminders} />
          </div>
        </div>

        {/* Upcoming Reminders */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : "text-lg"}`}>
              Upcoming
            </h2>
            <button className="flex items-center gap-1 text-primary">
              <Plus className="w-4 h-4" />
              <span className={`font-medium ${elderlyMode ? "text-base" : "text-sm"}`}>Add</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {upcomingReminders.map((reminder) => (
              <button
                key={reminder.id}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl text-left hover:shadow-md transition-shadow"
              >
                <div
                  className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-xl ${reminder.color} flex items-center justify-center shrink-0`}
                >
                  <reminder.icon
                    className={`${elderlyMode ? "w-7 h-7" : "w-6 h-6"} text-primary-foreground`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-foreground truncate ${elderlyMode ? "text-lg" : ""}`}
                  >
                    {reminder.title}
                  </p>
                  <p
                    className={`text-muted-foreground truncate ${elderlyMode ? "text-base" : "text-sm"}`}
                  >
                    {reminder.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{reminder.date}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm font-medium ${reminder.daysLeft <= 3 ? "text-danger" : "text-foreground"}`}
                  >
                    {reminder.daysLeft} days
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground mt-1 ml-auto" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recurring Behaviors */}
        <div className="mb-6">
          <h2
            className={`font-semibold text-foreground mb-4 ${elderlyMode ? "text-xl" : "text-lg"}`}
          >
            Detected Patterns
          </h2>
          <div className="bg-card rounded-2xl overflow-hidden">
            {recurringBehaviors.map((behavior, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 ${index !== recurringBehaviors.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className={`font-medium text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                      {behavior.title}
                    </p>
                    <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
                      {behavior.description}
                    </p>
                  </div>
                </div>
                <Switch defaultChecked={behavior.enabled} />
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Settings */}
        <div>
          <h2
            className={`font-semibold text-foreground mb-4 ${elderlyMode ? "text-xl" : "text-lg"}`}
          >
            Settings
          </h2>
          <div className="bg-card rounded-2xl overflow-hidden">
            {[
              { label: "Remind 3 days before due", enabled: true },
              { label: "Remind on due date", enabled: true },
              { label: "Send SMS reminders", enabled: false },
            ].map((setting, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-4 ${index !== 2 ? "border-b border-border" : ""}`}
              >
                <span className={`text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                  {setting.label}
                </span>
                <Switch defaultChecked={setting.enabled} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

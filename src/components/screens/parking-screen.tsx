"use client";

import { ArrowLeft, MapPin, Car, Clock, Check, Navigation } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccessibility } from "@/context/accessibility-context";

interface ParkingScreenProps {
  onBack: () => void;
}

type Step = "map" | "detail" | "payment" | "success";

const parkingSpots = [
  { id: 1, name: "KLCC Parking", distance: "0.3 km", rate: "RM 4/hr", available: 45 },
  { id: 2, name: "Pavilion KL", distance: "0.5 km", rate: "RM 5/hr", available: 23 },
  { id: 3, name: "Lot 10 Basement", distance: "0.7 km", rate: "RM 3/hr", available: 67 },
];

export function ParkingScreen({ onBack }: ParkingScreenProps) {
  const [step, setStep] = useState<Step>("map");
  const [selectedSpot, setSelectedSpot] = useState<(typeof parkingSpots)[0] | null>(null);
  const [duration, setDuration] = useState(2);
  const { elderlyMode, t } = useAccessibility();

  const totalAmount = selectedSpot
    ? duration * parseFloat(selectedSpot.rate.replace("RM ", "").replace("/hr", ""))
    : 0;

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
          Parking Paid!
        </h2>
        <p className={`text-muted-foreground text-center mb-2 ${elderlyMode ? "text-lg" : ""}`}>
          {duration} hours at {selectedSpot?.name}
        </p>
        <p className={`font-semibold text-foreground mb-2 ${elderlyMode ? "text-2xl" : "text-xl"}`}>
          RM {totalAmount.toFixed(2)}
        </p>
        <p
          className={`text-muted-foreground text-center mb-8 ${elderlyMode ? "text-base" : "text-sm"}`}
        >
          Valid until 5:30 PM
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

  // Payment Screen
  if (step === "payment" && selectedSpot) {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("detail")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            {t("confirm")} {t("payment")}
          </h1>
        </div>

        <div className="flex-1">
          <div className="bg-card rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center">
                <Car className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <p
                  className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : "text-lg"}`}
                >
                  {selectedSpot.name}
                </p>
                <p className={`text-muted-foreground ${elderlyMode ? "text-base" : "text-sm"}`}>
                  {selectedSpot.rate}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4">
            <div
              className={`flex items-center justify-between py-3 ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-muted-foreground">Duration</span>
              <span className="font-semibold text-foreground">{duration} hours</span>
            </div>
            <div
              className={`flex items-center justify-between py-3 border-t border-border ${elderlyMode ? "text-lg" : ""}`}
            >
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium text-foreground">{selectedSpot.rate}</span>
            </div>
            <div
              className={`flex items-center justify-between py-3 border-t border-border ${elderlyMode ? "text-xl" : "text-lg"}`}
            >
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-foreground">RM {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("success")}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            Pay RM {totalAmount.toFixed(2)}
          </Button>
        </div>
      </div>
    );
  }

  // Parking Detail Screen
  if (step === "detail" && selectedSpot) {
    return (
      <div className="flex-1 flex flex-col px-5 pb-28 bg-background">
        <div className="flex items-center gap-4 py-4 mb-4">
          <button
            onClick={() => setStep("map")}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className={`font-semibold text-foreground ${elderlyMode ? "text-2xl" : "text-xl"}`}>
            Parking Details
          </h1>
        </div>

        <div className="flex-1">
          {/* Parking Info */}
          <div className="bg-card rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
                <Car className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <p
                  className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : "text-lg"}`}
                >
                  {selectedSpot.name}
                </p>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className={`${elderlyMode ? "text-base" : "text-sm"}`}>
                    {selectedSpot.distance} away
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-muted-foreground text-sm">Rate</p>
                <p
                  className={`font-semibold text-foreground ${elderlyMode ? "text-xl" : "text-lg"}`}
                >
                  {selectedSpot.rate}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Available</p>
                <p className={`font-semibold text-success ${elderlyMode ? "text-xl" : "text-lg"}`}>
                  {selectedSpot.available} spots
                </p>
              </div>
            </div>
          </div>

          {/* Duration Selection */}
          <div className="mb-6">
            <p className={`font-medium text-foreground mb-3 ${elderlyMode ? "text-lg" : ""}`}>
              Select Duration
            </p>
            <div className="flex items-center justify-center gap-4 bg-card rounded-2xl p-4">
              <button
                onClick={() => setDuration(Math.max(1, duration - 1))}
                className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-xl bg-muted flex items-center justify-center text-foreground font-bold text-xl`}
              >
                -
              </button>
              <div className="text-center px-8">
                <p className={`font-bold text-foreground ${elderlyMode ? "text-4xl" : "text-3xl"}`}>
                  {duration}
                </p>
                <p className="text-muted-foreground">hours</p>
              </div>
              <button
                onClick={() => setDuration(Math.min(12, duration + 1))}
                className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl`}
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Duration */}
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 4, 8].map((hr) => (
              <button
                key={hr}
                onClick={() => setDuration(hr)}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${duration === hr ? "bg-primary text-primary-foreground" : "bg-card text-foreground"}`}
              >
                {hr} hr{hr > 1 ? "s" : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="py-4">
          <Button
            onClick={() => setStep("payment")}
            className={`w-full rounded-2xl gradient-primary ${elderlyMode ? "h-16 text-xl" : "h-14 text-lg"}`}
          >
            Continue - RM {totalAmount.toFixed(2)}
          </Button>
        </div>
      </div>
    );
  }

  // Map Location Screen
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
          {t("parking")}
        </h1>
      </div>

      {/* Map Placeholder */}
      <div className="relative h-48 bg-primary-light mx-5 rounded-2xl overflow-hidden mb-4">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Navigation className="w-12 h-12 text-primary mx-auto mb-2" />
            <p className="text-primary font-medium">Your Location</p>
          </div>
        </div>
        {/* Decorative map elements */}
        <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-accent" />
        <div className="absolute bottom-8 left-8 w-2 h-2 rounded-full bg-secondary" />
        <div className="absolute top-12 left-16 w-2 h-2 rounded-full bg-success" />
      </div>

      {/* Nearby Parking */}
      <div className="flex-1 px-5 pb-28">
        <p className={`font-medium text-foreground mb-3 ${elderlyMode ? "text-lg" : ""}`}>
          Nearby Parking
        </p>
        <div className="flex flex-col gap-3">
          {parkingSpots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => {
                setSelectedSpot(spot);
                setStep("detail");
              }}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl hover:shadow-md transition-shadow"
            >
              <div
                className={`${elderlyMode ? "w-14 h-14" : "w-12 h-12"} rounded-xl gradient-primary flex items-center justify-center shrink-0`}
              >
                <Car className={`${elderlyMode ? "w-7 h-7" : "w-6 h-6"} text-primary-foreground`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-semibold text-foreground ${elderlyMode ? "text-lg" : ""}`}>
                  {spot.name}
                </p>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span className={`${elderlyMode ? "text-base" : "text-sm"}`}>
                    {spot.distance}
                  </span>
                  <span className={`${elderlyMode ? "text-base" : "text-sm"}`}>{spot.rate}</span>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-success ${elderlyMode ? "text-lg" : ""}`}>
                  {spot.available}
                </p>
                <p className="text-muted-foreground text-xs">spots</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

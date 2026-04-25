import { useDonorStore } from "@/lib/crowdfunding/donor-store";
import { Heart, Users, HandHeart, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function ImpactSummary() {
  const { donatedTo, totalDonated } = useDonorStore();
  const peopleHelped = donatedTo.size * 3;
  const hasDonated = totalDonated > 0;

  return (
    <motion.section
      className="card-gradient-glow card-sheen relative mx-5 mt-4 overflow-hidden rounded-3xl p-5 text-white shadow-glow ring-1 ring-white/25"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
    >
      {/* Decorative animated blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl animate-blob" />
      <div
        className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-white/15 blur-2xl animate-blob"
        style={{ animationDelay: "2s" }}
      />
      {/* Shimmer sweep */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-90">
            <Sparkles className="h-3.5 w-3.5" />
            Your Impact
          </p>
          {hasDonated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
              <TrendingUp className="h-3 w-3" />
              Active
            </span>
          )}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider opacity-80">
              Total contributed
            </p>
            <p className="mt-0.5 text-4xl font-extrabold leading-none tracking-tight">
              <span className="text-base font-bold opacity-80">RM</span>
              {totalDonated}
            </p>
          </div>
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
            <Heart className="h-7 w-7 fill-white" />
            {hasDonated && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-brand-blue shadow-md">
                {donatedTo.size}
              </span>
            )}
          </div>
        </div>

        <p className="mt-3 text-sm font-medium leading-snug opacity-95">
          {hasDonated
            ? `You've moved ${donatedTo.size} ${donatedTo.size === 1 ? "story" : "stories"} forward ❤️`
            : "Every ringgit moves a real story forward."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat
            icon={<HandHeart className="h-3.5 w-3.5" />}
            label="Supported"
            value={String(donatedTo.size)}
          />
          <Stat
            icon={<Users className="h-3.5 w-3.5" />}
            label="People helped"
            value={String(peopleHelped)}
          />
        </div>
      </div>
    </motion.section>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/15 px-3 py-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider opacity-90">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-extrabold leading-none">{value}</p>
    </div>
  );
}

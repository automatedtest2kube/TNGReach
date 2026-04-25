import { AppHeader } from "@/components/crowdfunding/AppHeader";
import { ImpactSummary } from "@/components/crowdfunding/ImpactSummary";
import { CategoryFilters } from "@/components/crowdfunding/CategoryFilters";
import { CampaignCard } from "@/components/crowdfunding/CampaignCard";
import { AISuggestionPopup } from "@/components/crowdfunding/AISuggestionPopup";
import { DonationMap } from "@/components/crowdfunding/DonationMap";
import { RequestorLogin } from "@/components/crowdfunding/RequestorLogin";
import { CreateCampaignFlow } from "@/components/crowdfunding/CreateCampaignFlow";
import { RequestorDashboard } from "@/components/crowdfunding/RequestorDashboard";
import { useDonorStore } from "@/lib/crowdfunding/donor-store";
import { requestorStore, useRequestorStore } from "@/lib/crowdfunding/requestor-store";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface CrowdfundingHubScreenProps {
  onBack: () => void;
}

type Tab = "discover" | "map" | "request";

const TABS: { id: Tab; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "map", label: "Map" },
  { id: "request", label: "Request" },
];

const tabContent = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 34 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

export function CrowdfundingHubScreen({ onBack }: CrowdfundingHubScreenProps) {
  const [tab, setTab] = useState<Tab>("discover");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-auto pb-28">
        <div className="mx-auto w-full max-w-lg">
          {/* Sticky: back + tabs — keep under 4rem tall so title below can use `top-16` */}
          <div
            className="sticky top-0 z-40 flex h-16 max-h-16 items-center gap-1.5 border-b border-[color:color-mix(in_oklab,var(--color-brand-purple)_14%,transparent)] bg-[linear-gradient(180deg,oklch(0.985_0.012_280/0.96)_0%,oklch(0.98_0.02_280/0.8)_100%)] px-5 py-2 backdrop-blur-md"
            style={{ WebkitBackfaceVisibility: "hidden" }}
          >
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 rounded-full border border-[color:color-mix(in_oklab,var(--color-brand-purple)_18%,transparent)] bg-[color:color-mix(in_oklab,white_82%,var(--color-background))] px-3.5 py-2 text-sm font-semibold text-foreground shadow-soft backdrop-blur-sm [touch-action:manipulation] active:scale-[0.98]"
            >
              Back
            </button>
            <div
              className="grid min-w-0 flex-1 grid-cols-3 rounded-2xl border border-[color:color-mix(in_oklab,var(--color-brand-purple)_12%,white)] p-0.5 shadow-sm"
              style={{
                background:
                  "color-mix(in oklab, var(--color-brand-purple) 6%, color-mix(in oklab, white 88%, var(--color-background)))",
              }}
            >
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`rounded-[10px] px-1 py-2 text-[10px] font-bold uppercase leading-tight tracking-wide transition-all [touch-action:manipulation] active:scale-[0.98] sm:px-1.5 sm:py-2.5 sm:text-xs ${
                    tab === id
                      ? "bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {tab === "discover" && (
              <motion.div key="discover" initial="initial" animate="animate" exit="exit" variants={tabContent}>
                <DiscoverTab />
              </motion.div>
            )}
            {tab === "map" && (
              <motion.div key="map" initial="initial" animate="animate" exit="exit" variants={tabContent}>
                <MapTab />
              </motion.div>
            )}
            {tab === "request" && (
              <motion.div key="request" initial="initial" animate="animate" exit="exit" variants={tabContent}>
                <RequestTab />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DiscoverTab() {
  const { campaigns } = useDonorStore();
  const [active, setActive] = useState<string>("All");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const filtered = useMemo(
    () => (active === "All" ? campaigns : campaigns.filter((c) => c.category === active)),
    [campaigns, active],
  );
  const suggested = useMemo(
    () =>
      [...campaigns]
        .filter((c) => c.raised < c.goal)
        .sort((a, b) => b.raised / b.goal - a.raised / a.goal)[0],
    [campaigns],
  );

  return (
    <>
      <AppHeader title="Stories worth supporting" subtitle="Real people. Real outcomes." />
      <ImpactSummary />
      <CategoryFilters active={active} onChange={setActive} />
      <div className="mt-4 space-y-4 px-5">
        {filtered.map((c) => (
          <motion.div
            key={c.id}
            ref={(el) => {
              cardRefs.current[c.id] = el;
            }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
          >
            <CampaignCard campaign={c} />
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No campaigns in this category yet.</p>
        )}
      </div>
      {suggested && (
        <AISuggestionPopup
          campaign={suggested}
          onView={(id) => cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
      )}
    </>
  );
}

function MapTab() {
  const { campaigns, donatedTo, totalDonated } = useDonorStore();
  const active = campaigns.filter((c) => donatedTo.has(c.id));
  const list = active.length > 0 ? active : campaigns.slice(0, 4);
  return (
    <>
      <AppHeader
        title="Your impact, on the map"
        subtitle={
          active.length > 0
            ? `RM${totalDonated} flowing to ${active.length} ${active.length === 1 ? "person" : "people"}`
            : "Sample of nearby active causes"
        }
      />
      <DonationMap campaigns={list} />
      <section className="mx-5 mt-5 pb-2">
        <h2 className="section-title section-title--sm text-foreground/80">
          {active.length > 0 ? "People you're helping" : "Try donating to see them here"}
        </h2>
        <div className="mt-3 space-y-2">
          {list.map((c) => {
            const pct = Math.min(100, Math.round((c.raised / c.goal) * 100));
            return (
              <div
                key={c.id}
                className="flex animate-fade-in items-center gap-3 rounded-2xl border border-border/60 bg-card/90 p-3 shadow-soft backdrop-blur-sm"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.usage}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full gradient-impact" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{pct}%</p>
                  <p className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Heart className="h-3 w-3" /> {c.supporters}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function RequestTab() {
  const { loggedIn, campaigns, name } = useRequestorStore();
  const [creating, setCreating] = useState(false);
  const [justPosted, setJustPosted] = useState(false);
  const showCreate = loggedIn && (creating || campaigns.length === 0);

  if (!loggedIn) {
    return (
      <>
        <AppHeader title="Need a hand?" subtitle="Sign in to start your campaign" />
        <RequestorLogin />
      </>
    );
  }

  if (showCreate) {
    return (
      <>
        <AppHeader
          title={campaigns.length === 0 ? "Tell us your story" : "New campaign"}
          subtitle={`Hi ${name} - let's set this up`}
        />
        <CreateCampaignFlow
          onPosted={() => {
            setCreating(false);
            setJustPosted(true);
            setTimeout(() => setJustPosted(false), 3500);
          }}
          onCancel={() => {
            if (campaigns.length > 0) setCreating(false);
            else requestorStore.logout();
          }}
        />
      </>
    );
  }

  return (
    <>
      <AppHeader title="My campaigns" subtitle="Track your impact in real time" />
      {justPosted && (
        <div className="mx-5 mt-3 animate-fade-in rounded-2xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-semibold text-success">
          Your campaign is live. Supporters can now donate.
        </div>
      )}
      <RequestorDashboard onCreateNew={() => setCreating(true)} />
    </>
  );
}

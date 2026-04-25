import { useEffect, useMemo, useState } from "react";
import { ALL_CATEGORIES, REGIONS, totalSpending, type Category } from "@/admin-original/data/regions";
import { inferAreaFromPoint, parseAreaKey } from "@/admin-original/data/areas";
import { inferSubsidyCategory, type SubsidyCategory } from "@/admin-original/data/subsidies";
import {
  findUser,
  getUserTransactions,
  USERS,
  type IncomeGroup,
  type UserProfile,
  type UserTransaction,
} from "@/admin-original/data/users";
import { TopRegionsPanel } from "@/admin-original/components/TopRegionsPanel";
import { UserRadarChart } from "@/admin-original/components/UserRadarChart";
import { FilterPanel, TIMEFRAMES, type AgeBucket, type TimeframeKey } from "@/admin-original/components/FilterPanel";
import { TransactionDialog } from "@/admin-original/components/TransactionDialog";
import { KpiCard } from "@/admin-original/components/KpiCard";
import { AzureMalaysiaMap } from "@/admin-original/components/AzureMalaysiaMap";
import { Activity, Banknote, MessageCircle, Send, Users, X } from "lucide-react";
import tngLogo from "@/assets/admin-logo-upload.png";
import adminAssistantRobot from "@/assets/mascot/shield.webp";

function matchesAgeBucket(age: number, bucket: AgeBucket): boolean {
  if (bucket === "18-24") return age >= 18 && age <= 24;
  if (bucket === "25-34") return age >= 25 && age <= 34;
  if (bucket === "35-44") return age >= 35 && age <= 44;
  if (bucket === "45-54") return age >= 45 && age <= 54;
  return age >= 55;
}

const Index = () => {
  type ChatMessage = { role: "bot" | "user"; text: string };
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedSubsidies, setSelectedSubsidies] = useState<SubsidyCategory[]>([]);
  const [ageBuckets, setAgeBuckets] = useState<AgeBucket[]>([]);
  const [incomeGroups, setIncomeGroups] = useState<IncomeGroup[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeKey>("30d");
  const [activeTxn, setActiveTxn] = useState<(UserTransaction & { userName?: string }) | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "bot", text: "How can I help you?" },
  ]);

  const effectiveCats = categories.length ? categories : ALL_CATEGORIES;
  const hasRegionFilter = selectedRegions.length > 0;
  const areaMatcher = useMemo(() => {
    if (!selectedAreas.length) return null;
    const set = new Set(selectedAreas);
    return (t: UserTransaction) => {
      const area = inferAreaFromPoint(t.region, t.lon, t.lat);
      if (!area) return false;
      return set.has(`${t.region}::${area}`);
    };
  }, [selectedAreas]);

  const totals = useMemo(() => {
    const scoped = hasRegionFilter
      ? REGIONS.filter((r) => selectedRegions.includes(r.state))
      : REGIONS;
    const totalSpend = scoped.reduce((s, r) => s + totalSpending(r, effectiveCats), 0);
    const totalTxns = scoped.reduce((s, r) => s + r.transactions, 0);
    const avgGrowth =
      scoped.length > 0 ? scoped.reduce((s, r) => s + r.growth, 0) / scoped.length : 0;
    return { totalSpend, totalTxns, avgGrowth };
  }, [effectiveCats, hasRegionFilter, selectedRegions]);

  // Resolve filtered user transactions within the time frame and category filter
  const userTxns = useMemo<UserTransaction[]>(() => {
    const days = TIMEFRAMES.find((t) => t.key === timeframe)?.days ?? 30;
    const cutoff = Date.now() - days * 86400_000;
    const scopedUsers = (activeUser ? [activeUser] : USERS).filter((u) => {
      const ageMatch =
        ageBuckets.length === 0 || ageBuckets.some((bucket) => matchesAgeBucket(u.age, bucket));
      const incomeMatch = incomeGroups.length === 0 || incomeGroups.includes(u.incomeGroup);
      return ageMatch && incomeMatch;
    });
    const scopedUserIds = scopedUsers.map((u) => u.id);
    const all = scopedUserIds.flatMap((uid) => getUserTransactions(uid));
    return all.filter(
      (t) =>
        t.timestamp >= cutoff &&
        (!hasRegionFilter || selectedRegions.includes(t.region)) &&
        (!areaMatcher || areaMatcher(t)) &&
        (selectedSubsidies.length === 0 || selectedSubsidies.includes(inferSubsidyCategory(t))) &&
        (categories.length === 0 || categories.includes(t.category))
    );
  }, [
    activeUser,
    ageBuckets,
    incomeGroups,
    timeframe,
    categories,
    hasRegionFilter,
    selectedRegions,
    areaMatcher,
    selectedSubsidies,
  ]);

  useEffect(() => {
    if (selectedRegion && hasRegionFilter && !selectedRegions.includes(selectedRegion)) {
      setSelectedRegion(null);
    }
  }, [selectedRegion, hasRegionFilter, selectedRegions]);

  useEffect(() => {
    if (!selectedAreas.length) return;
    const valid = selectedAreas.filter((k) => {
      const parsed = parseAreaKey(k);
      return parsed ? selectedRegions.includes(parsed.state) : false;
    });
    if (valid.length !== selectedAreas.length) setSelectedAreas(valid);
  }, [selectedAreas, selectedRegions]);

  const handleUserCommit = (q: string) => {
    setUserQuery(q);
    setActiveUser(findUser(q));
  };
  const handleUserClear = () => {
    setUserQuery("");
    setActiveUser(null);
  };

  const replyFor = (q: string): string => {
    const t = q.toLowerCase();
    if (t.includes("filter")) return "You can use Time Frame, Age, Spending Categories, Subsidy, Region, and District filters on the left.";
    if (t.includes("user")) return "Search user by IC in User Spending Profile, then hover home node for subsidy details.";
    if (t.includes("map")) return "On the map, click Top 5 Regions to highlight; hover region or nodes for details.";
    if (t.includes("subsidy")) return "Subsidy info is available in user profile and can be filtered in Subsidy Categories.";
    return "I can help with filters, map interactions, users, transactions, and subsidy insights. What do you want to explore?";
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatMessages((prev) => [...prev, { role: "user", text }]);
    setChatInput("");
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:4000";
      const resp = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: {
            timeframe,
            selectedRegions,
            selectedAreas,
            selectedSubsidies,
            categories,
            selectedRegion,
            activeUserId: activeUser?.id ?? null,
            transactionCount: userTxns.length,
          },
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const botText = typeof data?.reply === "string" && data.reply.trim()
        ? data.reply
        : replyFor(text);
      setChatMessages((prev) => [...prev, { role: "bot", text: botText }]);
    } catch {
      window.setTimeout(() => {
        setChatMessages((prev) => [...prev, { role: "bot", text: replyFor(text) }]);
      }, 180);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img
              src={tngLogo}
              alt="TNG Reach"
              className="h-14 w-auto rounded-md object-contain"
            />
            <div>
              <h1 className="text-base font-semibold leading-tight text-foreground">
                TNG Reach Admin Site
              </h1>
              <p className="text-xs text-muted-foreground">
                E-Wallet Spending Surveillance Â· Malaysia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Live Â· Real-time stream
            </div>
            <button className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border">
              Audit Log
            </button>
            <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
              Generate Report
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-12 gap-5 p-5">
        {/* Left filters */}
        <aside className="col-span-12 lg:col-span-2 space-y-5">
          <FilterPanel
            selected={categories}
            onChange={setCategories}
            selectedRegions={selectedRegions}
            onRegionsChange={setSelectedRegions}
            selectedAreas={selectedAreas}
            onAreasChange={setSelectedAreas}
            selectedSubsidies={selectedSubsidies}
            onSubsidiesChange={setSelectedSubsidies}
            selectedAgeBuckets={ageBuckets}
            onAgeBucketsChange={setAgeBuckets}
            selectedIncomeGroups={incomeGroups}
            onIncomeGroupsChange={setIncomeGroups}
            onClearUserFilter={handleUserClear}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </aside>

        {/* Center */}
        <section className="col-span-12 lg:col-span-7 space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Volume"
              value={`RM ${(totals.totalSpend / 1000).toFixed(2)}B`}
              delta={11.4}
              icon={Banknote}
            />
            <KpiCard
              label="Transactions"
              value={`${(totals.totalTxns / 1_000_000).toFixed(2)}M`}
              delta={8.7}
              icon={Activity}
            />
            <KpiCard label="Active Users" value="2.84M" delta={5.2} icon={Users} />
            <KpiCard
              label="Avg Growth"
              value={`${totals.avgGrowth.toFixed(1)}%`}
              delta={totals.avgGrowth}
              icon={Activity}
            />
          </div>

          <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Spending Intensity â€” Malaysia
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeUser
                    ? `${userTxns.length} transactions by ${activeUser.name} Â· last ${
                        TIMEFRAMES.find((t) => t.key === timeframe)?.label
                      }`
                    : "Drag to pan Â· Filter by user to see transaction particles"}
                </p>
              </div>
              {selectedRegion && (
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Clear selection
                </button>
              )}
            </div>
            <div className="h-[520px]">
              <AzureMalaysiaMap
                categories={effectiveCats}
                onSelectRegion={setSelectedRegion}
                selectedRegion={selectedRegion}
                filteredRegions={selectedRegions}
                userTransactions={userTxns}
                userFilterActive={!!activeUser}
                activeUser={activeUser}
                onSelectTxn={(t) =>
                  setActiveTxn(t ? { ...t, userName: activeUser?.name } : null)
                }
              />
            </div>
          </div>

        </section>

        {/* Right */}
        <aside className="col-span-12 lg:col-span-3 space-y-5">
          <UserRadarChart
            user={activeUser}
            filterCategories={categories}
            userQuery={userQuery}
            onUserQueryChange={setUserQuery}
            onUserCommit={handleUserCommit}
            onUserClear={handleUserClear}
          />
          <TopRegionsPanel
            categories={effectiveCats}
            selectedRegion={selectedRegion}
            onSelectRegion={setSelectedRegion}
            filteredRegions={selectedRegions}
            userTransactions={userTxns}
          />
        </aside>
      </div>

      <TransactionDialog txn={activeTxn} onClose={() => setActiveTxn(null)} />

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        {chatOpen && (
          <div className="w-[320px] max-w-[88vw] rounded-xl border border-border bg-card shadow-elevated overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-secondary/40">
              <div className="flex items-center gap-2">
                <img
                  src={adminAssistantRobot}
                  alt="TNG Assistant"
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span className="text-sm font-semibold text-foreground">TNG Assistant</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 py-3 space-y-2">
              <div className="max-h-56 overflow-auto space-y-2 pr-1">
                {chatMessages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={`max-w-[92%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-primary/10 text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-border pt-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                  placeholder="Ask the robot..."
                  rows={2}
                  className="flex-1 resize-none rounded-md border border-input bg-background px-2.5 py-1.5 text-sm leading-5 focus-visible:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={sendChat}
                  className="rounded-md bg-primary px-2.5 py-1.5 text-primary-foreground hover:bg-primary/90"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setChatOpen((v) => !v)}
          className="group relative rounded-full border border-border bg-card shadow-elevated hover:shadow-card transition-shadow"
          aria-label="Toggle assistant chat"
        >
          <img
            src={adminAssistantRobot}
            alt="Open assistant"
            className="h-20 w-20 rounded-full object-cover"
          />
          {!chatOpen && (
            <span className="absolute -top-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <MessageCircle className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Index;


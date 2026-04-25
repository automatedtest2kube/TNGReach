import { ALL_CATEGORIES, REGIONS, type Category } from "@/admin-original/data/regions";
import { getAreaOptionsForStates, parseAreaKey } from "@/admin-original/data/areas";
import { SUBSIDY_CATEGORIES, type SubsidyCategory } from "@/admin-original/data/subsidies";
import { type IncomeGroup } from "@/admin-original/data/users";
import {
  Utensils,
  Car,
  SprayCan,
  Shirt,
  PawPrint,
  ShoppingBasket,
  Film,
  ChevronDown,
} from "lucide-react";

const ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
  Food: Utensils,
  Transport: Car,
  Healthcare: SprayCan,
  Clothes: Shirt,
  "Essential": PawPrint,
  Groceries: ShoppingBasket,
  Entertainment: Film,
};

export type TimeframeKey = "24h" | "7d" | "30d" | "90d";
export type AgeBucket = "18-24" | "25-34" | "35-44" | "45-54" | "55+";
export const TIMEFRAMES: { key: TimeframeKey; label: string; days: number }[] = [
  { key: "24h", label: "24h", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];
export const AGE_BUCKETS: AgeBucket[] = ["18-24", "25-34", "35-44", "45-54", "55+"];
export const INCOME_GROUPS: IncomeGroup[] = ["B40", "M40", "T20"];

interface Props {
  selected: Category[];
  onChange: (next: Category[]) => void;
  selectedRegions: string[];
  onRegionsChange: (next: string[]) => void;
  selectedAreas: string[];
  onAreasChange: (next: string[]) => void;
  selectedSubsidies: SubsidyCategory[];
  onSubsidiesChange: (next: SubsidyCategory[]) => void;
  selectedAgeBuckets: AgeBucket[];
  onAgeBucketsChange: (next: AgeBucket[]) => void;
  selectedIncomeGroups: IncomeGroup[];
  onIncomeGroupsChange: (next: IncomeGroup[]) => void;
  onClearUserFilter: () => void;
  timeframe: TimeframeKey;
  onTimeframeChange: (t: TimeframeKey) => void;
}

export const FilterPanel = ({
  selected,
  onChange,
  selectedRegions,
  onRegionsChange,
  selectedAreas,
  onAreasChange,
  selectedSubsidies,
  onSubsidiesChange,
  selectedAgeBuckets,
  onAgeBucketsChange,
  selectedIncomeGroups,
  onIncomeGroupsChange,
  onClearUserFilter,
  timeframe,
  onTimeframeChange,
}: Props) => {
  const toggle = (c: Category) => {
    if (selected.includes(c)) onChange(selected.filter((x) => x !== c));
    else onChange([...selected, c]);
  };
  const allActive = selected.length === 0 || selected.length === ALL_CATEGORIES.length;
  const regionNames = REGIONS.map((r) => r.state);
  const areaOptions = getAreaOptionsForStates(selectedRegions);
  const regionAllActive = selectedRegions.length === 0 || selectedRegions.length === regionNames.length;
  const areaAllActive = selectedAreas.length === 0 || selectedAreas.length === areaOptions.length;
  const subsidyAllActive =
    selectedSubsidies.length === 0 || selectedSubsidies.length === SUBSIDY_CATEGORIES.length;
  const ageAllActive = selectedAgeBuckets.length === 0 || selectedAgeBuckets.length === AGE_BUCKETS.length;
  const incomeAllActive =
    selectedIncomeGroups.length === 0 || selectedIncomeGroups.length === INCOME_GROUPS.length;

  const toggleAgeBucket = (b: AgeBucket) => {
    if (selectedAgeBuckets.includes(b)) onAgeBucketsChange(selectedAgeBuckets.filter((x) => x !== b));
    else onAgeBucketsChange([...selectedAgeBuckets, b]);
  };
  const toggleIncomeGroup = (g: IncomeGroup) => {
    if (selectedIncomeGroups.includes(g))
      onIncomeGroupsChange(selectedIncomeGroups.filter((x) => x !== g));
    else onIncomeGroupsChange([...selectedIncomeGroups, g]);
  };
  const toggleRegion = (region: string) => {
    if (selectedRegions.includes(region)) onRegionsChange(selectedRegions.filter((x) => x !== region));
    else onRegionsChange([...selectedRegions, region]);
  };
  const toggleArea = (areaKey: string) => {
    if (selectedAreas.includes(areaKey)) onAreasChange(selectedAreas.filter((x) => x !== areaKey));
    else onAreasChange([...selectedAreas, areaKey]);
  };
  const toggleSubsidy = (s: SubsidyCategory) => {
    if (selectedSubsidies.includes(s)) onSubsidiesChange(selectedSubsidies.filter((x) => x !== s));
    else onSubsidiesChange([...selectedSubsidies, s]);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <button
          onClick={() => {
            onChange([]);
            onRegionsChange([]);
            onAreasChange([]);
            onSubsidiesChange([]);
            onAgeBucketsChange([]);
            onIncomeGroupsChange([]);
            onClearUserFilter();
          }}
          className="text-xs font-medium text-primary hover:underline"
        >
          Reset
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Income Group */}
        <details className="group rounded-md border border-border/60">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-2.5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Income Group</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-2.5 pb-2.5 grid grid-cols-3 gap-1.5">
            {INCOME_GROUPS.map((g) => {
              const active = incomeAllActive || selectedIncomeGroups.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleIncomeGroup(g)}
                  className={`rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </details>

        {/* Time frame */}
        <details className="group rounded-md border border-border/60">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-2.5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Time Frame</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-2.5 pb-2.5 grid grid-cols-4 gap-1 rounded-md bg-secondary p-1">
            {TIMEFRAMES.map((t) => (
              <button
                key={t.key}
                onClick={() => onTimeframeChange(t.key)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  timeframe === t.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </details>

        {/* Age */}
        <details className="group rounded-md border border-border/60" open>
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-2.5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Age</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-2.5 pb-2.5 grid grid-cols-2 gap-1.5">
            {AGE_BUCKETS.map((b) => {
              const active = ageAllActive || selectedAgeBuckets.includes(b);
              return (
                <button
                  key={b}
                  onClick={() => toggleAgeBucket(b)}
                  className={`rounded-md px-2.5 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </details>

        {/* Categories */}
        <details className="group rounded-md border border-border/60">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-2.5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Spending Categories</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-2.5 pb-2.5 grid grid-cols-1 gap-1.5">
            {ALL_CATEGORIES.map((c) => {
              const active = allActive || selected.includes(c);
              const Icon = ICONS[c];
              return (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      active ? "bg-primary text-primary-foreground" : "bg-secondary"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium">{c}</span>
                </button>
              );
            })}
          </div>
        </details>

        {/* Subsidy Categories */}
        <details className="group rounded-md border border-border/60">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-2.5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subsidy Categories</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-2.5 pb-2.5 grid grid-cols-1 gap-1.5">
            {SUBSIDY_CATEGORIES.map((s) => {
              const active = subsidyAllActive || selectedSubsidies.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSubsidy(s)}
                  className={`rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </details>

        {/* Region */}
        <details className="group rounded-md border border-border/60" open>
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-2.5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Region</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-2.5 pb-2.5 grid grid-cols-1 gap-1.5 max-h-44 overflow-auto pr-1">
            {regionNames.map((region) => {
              const active = regionAllActive || selectedRegions.includes(region);
              return (
                <button
                  key={region}
                  onClick={() => toggleRegion(region)}
                  className={`rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </details>

        {/* Area */}
        <details className="group rounded-md border border-border/60">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-2.5 py-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">District</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          {selectedRegions.length === 0 ? (
            <div className="px-2.5 pb-2.5 text-[11px] text-muted-foreground">
              Select one or more regions to filter by area.
            </div>
          ) : (
            <div className="px-2.5 pb-2.5 grid grid-cols-1 gap-1.5 max-h-44 overflow-auto pr-1">
              {areaOptions.map((areaKey) => {
                const parsed = parseAreaKey(areaKey);
                if (!parsed) return null;
                const active = areaAllActive || selectedAreas.includes(areaKey);
                return (
                  <button
                    key={areaKey}
                    onClick={() => toggleArea(areaKey)}
                    className={`rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {parsed.area}
                    {selectedRegions.length > 1 && (
                      <span className="ml-1 text-[10px] text-muted-foreground">({parsed.state})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </details>
      </div>
    </div>
  );
};




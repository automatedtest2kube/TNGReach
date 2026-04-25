import { CATEGORIES } from "@/lib/crowdfunding/mock-data";
import { cn } from "@/lib/utils";

interface Props {
  active: string;
  onChange: (c: string) => void;
}

export function CategoryFilters({ active, onChange }: Props) {
  return (
    <div className="mt-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = active === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all [touch-action:manipulation] active:scale-[0.98]",
                isActive
                  ? "bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-soft"
                  : "border border-border/50 bg-card/80 text-foreground/90 backdrop-blur-sm hover:border-brand-purple/25 hover:bg-accent/60",
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}

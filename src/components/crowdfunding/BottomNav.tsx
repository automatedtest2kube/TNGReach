import { Link, useLocation } from "@tanstack/react-router";
import { HandHeart, Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { pathname } = useLocation();
  const items = [
    { to: "/", label: "Discover", icon: Heart },
    { to: "/map", label: "Impact Map", icon: MapPin },
    { to: "/request", label: "Request", icon: HandHeart },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-4 pb-[env(safe-area-inset-bottom)] pt-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                  active && "bg-gradient-to-br from-brand-blue to-brand-purple text-white shadow-glow",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

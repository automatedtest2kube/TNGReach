import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="relative rounded-[3rem] bg-gradient-to-br from-[oklch(0.78_0.08_270)] to-[oklch(0.7_0.12_290)] p-[6px] shadow-[0_40px_80px_-30px_rgba(80,40,170,0.55)]">
        <div className="rounded-[2.7rem] bg-gradient-to-b from-[oklch(0.97_0.02_280)] via-[oklch(0.96_0.04_265)] to-[oklch(0.93_0.06_290)] overflow-hidden">
          {/* notch */}
          <div className="relative flex items-center justify-center pt-3">
            <div className="h-6 w-32 rounded-full bg-foreground/85" />
          </div>
          <div className="relative h-[720px] overflow-hidden">{children}</div>
          {/* home indicator */}
          <div className="flex items-center justify-center py-3">
            <div className="h-1.5 w-32 rounded-full bg-foreground/30" />
          </div>
        </div>
      </div>
    </div>
  );
}

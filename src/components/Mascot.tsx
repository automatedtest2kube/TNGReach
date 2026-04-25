import { useEffect, useRef, useState } from "react";
// Inline mascots as base64 data URIs — ship with JS bundle, zero network latency
import happy from "@/assets/mascot/happy.webp?inline";
import wink from "@/assets/mascot/wink.webp?inline";
import love from "@/assets/mascot/love.webp?inline";
import cheer from "@/assets/mascot/cheer.webp?inline";
import idle from "@/assets/mascot/idle.webp?inline";
import jump from "@/assets/mascot/jump.webp?inline";
import shield from "@/assets/mascot/shield.webp?inline";
import gift from "@/assets/mascot/gift.webp?inline";

const POSES = { happy, wink, love, cheer, idle, jump, shield, gift } as const;
export type MascotPose = keyof typeof POSES;
export type MascotMood = "idle" | "wave" | "wink" | "jump" | "shake" | "celebrate";

interface Props {
  pose?: MascotPose;
  mood?: MascotMood;
  size?: number;
  followPointer?: boolean;
  className?: string;
}

/**
 * 3D-styled animated mascot.
 * - Subtle "breathing" idle motion for a living feel
 * - Mood-driven motions: wave, wink, jump, shake, celebrate
 * - Optional pointer follow for parallax tilt
 * - Soft contact shadow that pulses with breathing
 */
export function Mascot({
  pose = "idle",
  mood = "idle",
  size = 200,
  followPointer = true,
  className = "",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [popKey, setPopKey] = useState(0);

  // pop animation when pose changes
  useEffect(() => {
    setPopKey((k) => k + 1);
  }, [pose, mood]);

  useEffect(() => {
    if (!followPointer) return;
    const handler = (e: PointerEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / window.innerWidth;
      const dy = (e.clientY - cy) / window.innerHeight;
      setTilt({ x: Math.max(-1, Math.min(1, dx)) * 8, y: Math.max(-1, Math.min(1, dy)) * 6 });
    };
    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, [followPointer]);

  const moodAnim =
    mood === "jump"
      ? "animate-jump-3d"
      : mood === "shake"
        ? "animate-shake"
        : mood === "celebrate"
          ? "animate-bob"
          : "animate-breathe";

  return (
    <div
      ref={wrapRef}
      className={`relative inline-block [&_*]:pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        perspective: "800px",
      }}
    >
      {/* contact shadow */}
      <div
        aria-hidden
        className="animate-shadow absolute bottom-1 left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-[50%] bg-brand-purple/45 blur-md"
      />

      {/* 3D tilt wrapper (pointer parallax) */}
      <div
        className="relative h-full w-full transition-transform duration-300 ease-out"
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${-tilt.y}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* mood motion wrapper */}
        <div
          key={`${pose}-${popKey}`}
          className={`relative h-full w-full ${moodAnim}`}
          style={{ animationIterationCount: mood === "shake" ? 1 : "infinite" }}
        >
          <img
            src={POSES[pose]}
            alt="TNG Reach mascot"
            width={size}
            height={size}
            loading="eager"
            decoding="async"
            className="relative z-10 h-full w-full select-none object-contain pointer-events-none drop-shadow-[0_18px_24px_rgba(80,40,170,0.35)]"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

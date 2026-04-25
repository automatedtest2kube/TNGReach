import { motion } from "framer-motion";
import logo from "@/assets/tng-reach-logo.png";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;
const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export function SplashScreen() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[linear-gradient(100deg,oklch(0.95_0.04_270)_0%,oklch(0.94_0.045_285)_45%,oklch(0.95_0.05_70)_100%)] font-sans">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(at_20%_10%,oklch(0.92_0.08_265/0.45),transparent_60%),radial-gradient(at_85%_15%,oklch(0.9_0.1_60/0.32),transparent_58%),radial-gradient(at_50%_95%,oklch(0.88_0.1_300/0.25),transparent_60%)]"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <motion.div
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: EASE_IN_OUT }}
          className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.62_0.18_265/0.18),transparent_72%)] blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -60, 30, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: EASE_IN_OUT }}
          className="absolute left-[20%] top-[30%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,oklch(0.78_0.17_60/0.12),transparent_72%)] blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }}
          transition={{ duration: 16, repeat: Number.POSITIVE_INFINITY, ease: EASE_IN_OUT }}
          className="absolute right-[15%] bottom-[25%] h-[430px] w-[430px] rounded-full bg-[radial-gradient(closest-side,oklch(0.55_0.22_295/0.12),transparent_72%)] blur-3xl"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{
          opacity: { duration: 0.4 },
          y: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: EASE_IN_OUT, delay: 3.2 },
        }}
        className="relative z-10 flex flex-col items-center gap-7"
      >
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ scale: 2.1, opacity: 0, x: 0 }}
            animate={{ scale: 1, opacity: 1, x: -90 }}
            transition={{
              opacity: { duration: 0.8, ease: EASE_OUT },
              scale: { duration: 1.1, delay: 0.6, ease: EASE_OUT },
              x: { type: "spring", stiffness: 110, damping: 16, mass: 0.9, delay: 1.6 },
            }}
            className="relative z-20"
          >
            <div className="relative h-[140px] w-[140px]">
              <motion.div
                aria-hidden
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{ opacity: [0.25, 0.55, 0.32], scale: [0.86, 1.08, 1] }}
                transition={{ duration: 2.4, ease: EASE_OUT, repeat: Number.POSITIVE_INFINITY }}
                className="absolute inset-0 -z-10 rounded-[26%] bg-[radial-gradient(closest-side,oklch(0.62_0.18_265/0.55),transparent_75%)] blur-xl"
              />
              <img
                src={logo}
                alt="TNG Reach logo"
                className="h-full w-full select-none object-contain"
                draggable={false}
              />
              <motion.div
                aria-hidden
                initial={{ x: "-120%", opacity: 0 }}
                animate={{ x: "120%", opacity: [0, 0.55, 0] }}
                transition={{ duration: 1.3, delay: 1.8, ease: EASE_OUT }}
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(115deg, transparent 35%, oklch(1 0 0 / 0.42) 50%, transparent 65%)",
                  mixBlendMode: "overlay",
                }}
              />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, x: -30, scaleX: 0.7, filter: "blur(16px)" }}
            animate={{ opacity: 1, x: 70, scaleX: 1, filter: "blur(0px)" }}
            transition={{
              opacity: { duration: 0.5, delay: 1.3, ease: EASE_OUT },
              x: { type: "spring", stiffness: 120, damping: 18, mass: 0.9, delay: 1.3 },
              scaleX: { duration: 0.8, delay: 1.3, ease: EASE_OUT },
              filter: { duration: 0.7, delay: 1.3, ease: EASE_OUT },
            }}
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-4xl font-bold tracking-tight md:text-5xl"
          >
            <span className="text-brand-purple">TNG</span>{" "}
            <span className="text-reach-hero font-extrabold">Reach</span>
          </motion.h1>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 2.1, ease: EASE_OUT }}
          className="text-center text-sm font-medium tracking-wide text-foreground/70 md:text-base"
        >
          Payment management made simple
        </motion.p>
      </motion.div>
    </div>
  );
}

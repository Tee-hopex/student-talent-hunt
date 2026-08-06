import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

/**
 * A single split-flap digit, like an airport departure board or a real
 * theater marquee letter board. The old digit's top half flips down and
 * away (rotateX) to reveal the new digit already sitting underneath.
 */
function FlapDigit({ value }: { value: string }) {
  const prefersReducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const [flipping, setFlipping] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (value === display) return;

    if (prefersReducedMotion) {
      setDisplay(value);
      return;
    }

    setFlipping(display);
    timeoutRef.current = setTimeout(() => {
      setDisplay(value);
      setFlipping(null);
    }, 320);

    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flap-cell">
      <div className="flap-half flap-half-top">
        <span className="flap-glyph">{display}</span>
      </div>
      <div className="flap-half flap-half-bottom">
        <span className="flap-glyph">{display}</span>
      </div>
      <div className="flap-seam" />
      {flipping !== null && (
        <motion.div
          className="flap-half flap-half-top flap-flip"
          style={{ perspective: 300 }}
          initial={{ rotateX: 0 }}
          animate={{ rotateX: -90 }}
          transition={{ duration: 0.32, ease: [0.6, 0.05, 0.15, 1] }}
        >
          <span className="flap-glyph">{flipping}</span>
        </motion.div>
      )}
    </div>
  );
}

function FlapGroup({ value, label }: { value: number; label: string }) {
  const [tens, ones] = String(value).padStart(2, "0").split("");
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-[3px]">
        <FlapDigit value={tens} />
        <FlapDigit value={ones} />
      </div>
      <span className="text-[0.65rem] font-bold tracking-[0.2em] text-cream/60 uppercase">{label}</span>
    </div>
  );
}

function BulbRow() {
  const bulbs = Array.from({ length: 14 });
  return (
    <div className="flex justify-between px-2">
      {bulbs.map((_, i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-gold sm:size-2.5"
          style={{
            boxShadow: "var(--shadow-bulb)",
            animation: `bulb-pulse 2.4s ease-in-out ${(i % 4) * 0.3}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

interface MarqueeCountdownProps {
  target: Date | string;
  label?: string;
  className?: string;
}

export function MarqueeCountdown({ target, label, className }: MarqueeCountdownProps) {
  const parts = useCountdown(target);

  if (!parts) return null;

  if (parts.isPast) {
    return (
      <div
        className={cn(
          "border-2 border-gold bg-ink px-6 py-4 text-center font-display text-2xl text-gold uppercase",
          className,
        )}
      >
        {label ?? "It's showtime!"}
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-lg", className)}>
      <div className="border-2 border-ink bg-plum-light px-4 py-3 sm:px-6 sm:py-4">
        <BulbRow />
        <div
          className="mt-3 flex items-end justify-center gap-3 sm:gap-5 [--flap-w:26px] [--flap-h:38px] sm:[--flap-w:38px] sm:[--flap-h:54px]"
        >
          <FlapGroup value={parts.days} label="Days" />
          <span className="pb-4 font-display text-2xl text-gold/50 sm:text-3xl">:</span>
          <FlapGroup value={parts.hours} label="Hrs" />
          <span className="pb-4 font-display text-2xl text-gold/50 sm:text-3xl">:</span>
          <FlapGroup value={parts.minutes} label="Min" />
          <span className="pb-4 font-display text-2xl text-gold/50 sm:text-3xl">:</span>
          <FlapGroup value={parts.seconds} label="Sec" />
        </div>
        <div className="mt-3">
          <BulbRow />
        </div>
      </div>
    </div>
  );
}

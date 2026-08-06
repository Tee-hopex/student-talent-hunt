import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StampRevealProps {
  text: string;
  className?: string;
}

/**
 * The "stamp" motion moment: a rubber-stamp confirmation for registration
 * submit / vote cast. Slams down with an overshoot bounce, slightly
 * rotated, like ink hitting paper. Falls back to a plain static badge
 * under prefers-reduced-motion.
 */
export function StampReveal({ text, className }: StampRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 2.4, rotate: -20 }}
      animate={{ opacity: 1, scale: 1, rotate: -8 }}
      transition={
        prefersReducedMotion ? { duration: 0.2 } : { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
      }
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden border-4 border-coral px-6 py-3 font-display text-2xl tracking-wide text-coral sm:text-3xl",
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, currentColor 0%, transparent 45%), radial-gradient(circle at 75% 65%, currentColor 0%, transparent 40%)",
        }}
      />
      <span className="relative">{text}</span>
    </motion.div>
  );
}

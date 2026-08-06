import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  light?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  light,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <span
          className={cn(
            "mb-3 inline-block border-2 px-2.5 py-0.5 text-xs font-bold tracking-[0.15em] uppercase",
            light ? "border-gold text-gold" : "border-coral text-coral",
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "text-4xl sm:text-5xl md:text-6xl",
          light ? "text-cream" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-4 font-sans text-base normal-case sm:text-lg",
            light ? "text-cream/70" : "text-ink-soft",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

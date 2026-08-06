import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds ticket-stub notches on the left/right edges. Set `notchBg` if the
   *  card doesn't sit directly on the cream page background. */
  ticket?: boolean;
  notchBg?: string;
}

export function Card({ className, children, ticket, notchBg, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border-2 border-ink bg-white shadow-[var(--shadow-sticker)] transition-transform duration-200",
        ticket && "ticket-notch",
        className,
      )}
      style={notchBg ? ({ ...style, "--notch-bg": notchBg } as CSSProperties) : style}
      {...props}
    >
      {children}
    </div>
  );
}

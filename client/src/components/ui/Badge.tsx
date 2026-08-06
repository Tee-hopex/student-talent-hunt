import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold tracking-wide uppercase",
  {
    variants: {
      variant: {
        coral: "bg-coral text-cream",
        gold: "bg-gold text-ink",
        plum: "bg-plum text-cream border-cream/30",
        neutral: "bg-cream text-ink",
        success: "bg-green text-cream",
        warning: "bg-gold text-ink",
        danger: "bg-coral text-cream",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, variant, className }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}

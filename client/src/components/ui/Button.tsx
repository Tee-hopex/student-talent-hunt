import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold uppercase tracking-wide transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 active:translate-x-0 active:translate-y-0 active:shadow-none",
  {
    variants: {
      variant: {
        primary:
          "border-2 border-ink bg-coral text-cream shadow-[var(--shadow-sticker)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)]",
        gold: "border-2 border-ink bg-gold text-ink shadow-[var(--shadow-sticker)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)]",
        dark: "border-2 border-ink bg-plum text-cream shadow-[var(--shadow-sticker)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_var(--color-ink)]",
        outline:
          "border-2 border-ink text-ink bg-transparent hover:bg-ink/[0.05]",
        ghost: "text-ink hover:bg-ink/[0.06]",
        "outline-light":
          "border-2 border-cream/40 text-cream bg-transparent hover:border-cream hover:bg-cream/10",
        "ghost-light": "text-cream/70 hover:text-cream hover:bg-cream/10",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  /** Render props onto the single child element (e.g. a router Link) instead of a <button>. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, disabled, asChild, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

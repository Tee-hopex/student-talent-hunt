import { Fragment } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => (
        <Fragment key={label}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 border-ink font-display text-base",
                i < current && "bg-green text-cream",
                i === current && "bg-gold text-ink",
                i > current && "bg-white text-ink-soft",
              )}
            >
              {i < current ? <Check className="size-4" /> : i + 1}
            </div>
            <span className="hidden text-[0.6rem] font-bold tracking-wide text-ink-soft uppercase sm:block">
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("mx-2 h-0.5 flex-1 border-t-2 border-dashed", i < current ? "border-ink" : "border-ink/25")} />
          )}
        </Fragment>
      ))}
    </div>
  );
}

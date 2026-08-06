import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
}

export const CheckboxField = forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name ?? "checkbox";
    return (
      <div>
        <label htmlFor={fieldId} className="flex cursor-pointer items-start gap-3">
          <span className="relative mt-0.5 flex size-5 shrink-0">
            <input
              ref={ref}
              id={fieldId}
              type="checkbox"
              className={cn("peer absolute inset-0 z-10 size-full cursor-pointer appearance-none opacity-0", className)}
              {...props}
            />
            <span className="pointer-events-none absolute inset-0 border-2 border-ink bg-white peer-checked:bg-gold" />
            <Check className="pointer-events-none absolute inset-0 m-auto size-3.5 scale-0 text-ink transition-transform peer-checked:scale-100" />
          </span>
          <span className="text-sm text-ink-soft">{label}</span>
        </label>
        {error && <p className="mt-1.5 ml-8 text-xs font-semibold text-coral">{error}</p>}
      </div>
    );
  },
);
CheckboxField.displayName = "CheckboxField";

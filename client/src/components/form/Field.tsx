import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldShell({ label, htmlFor, error, hint, required, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold tracking-wide text-ink uppercase">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-coral">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full border-2 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none transition-colors disabled:cursor-not-allowed disabled:bg-ink/5";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label;
    return (
      <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
        <input
          ref={ref}
          id={fieldId}
          className={cn(controlClass, error ? "border-coral" : "border-ink/25 focus:border-ink", className)}
          {...props}
        />
      </FieldShell>
    );
  },
);
InputField.displayName = "InputField";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  ({ label, error, hint, required, id, className, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label;
    return (
      <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(controlClass, "min-h-24 resize-y", error ? "border-coral" : "border-ink/25 focus:border-ink", className)}
          {...props}
        />
      </FieldShell>
    );
  },
);
TextareaField.displayName = "TextareaField";

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, hint, required, id, className, placeholder, options, ...props }, ref) => {
    const fieldId = id ?? props.name ?? label;
    return (
      <FieldShell label={label} htmlFor={fieldId} error={error} hint={hint} required={required}>
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            className={cn(
              controlClass,
              "appearance-none pr-9",
              error ? "border-coral" : "border-ink/25 focus:border-ink",
              className,
            )}
            {...(props.value === undefined ? { defaultValue: "" } : {})}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink" />
        </div>
      </FieldShell>
    );
  },
);
SelectField.displayName = "SelectField";

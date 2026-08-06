import { useRef, useState, type DragEvent } from "react";
import { FileCheck, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropFieldProps {
  label: string;
  hint?: string;
  accept: string;
  error?: string;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileDropField({ label, hint, accept, error, required, value, onChange }: FileDropFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onChange(file);
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold tracking-wide text-ink uppercase">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer items-center gap-3 border-2 border-dashed px-4 py-3.5 transition-colors",
          error ? "border-coral bg-coral/5" : dragging ? "border-ink bg-gold/10" : "border-ink/30 bg-white hover:border-ink/60",
          value && "border-solid border-green bg-green/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {value ? (
          <>
            <FileCheck className="size-5 shrink-0 text-green" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{value.name}</p>
              <p className="text-xs text-ink-soft">{formatSize(value.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-ink/20 text-ink-soft hover:border-coral hover:text-coral"
              aria-label={`Remove ${label}`}
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="size-5 shrink-0 text-ink-soft" />
            <p className="text-sm text-ink-soft">
              Drop your file here or <span className="font-semibold text-coral underline">browse</span>
            </p>
          </>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs font-semibold text-coral">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

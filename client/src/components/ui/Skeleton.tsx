import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-sm bg-gradient-to-r from-ink/[0.07] via-ink/[0.14] to-ink/[0.07] bg-[length:200%_100%]",
        className,
      )}
      style={{ animation: "shimmer 1.6s ease-in-out infinite" }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-sm border-2 border-ink/20 bg-white p-6 shadow-[var(--shadow-sticker-sm)]">
      <Skeleton className="mb-4 h-40 w-full" />
      <Skeleton className="mb-2 h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

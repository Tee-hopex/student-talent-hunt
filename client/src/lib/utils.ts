import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...opts,
  });
}

export function fileUrl(key?: string | null): string | undefined {
  if (!key) return undefined;
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  return `${base}/uploads/${key}`;
}

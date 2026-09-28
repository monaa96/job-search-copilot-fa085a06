import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatShortDate(iso: string | null | undefined, withYear = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(withYear ? { year: "numeric" } : {}) });
}

const DAY = 86_400_000;
function daysAgo(iso: string) {
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return null;
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.max(0, Math.round((start(new Date()) - start(d)) / DAY));
}
/** "Posted today" / "Posted 3 days ago" / "Posted 2 weeks ago" / "Posted Aug 27"; null when unknown. */
export function formatPostedAge(iso: string | null | undefined) {
  if (!iso) return null;
  const n = daysAgo(iso); if (n === null) return null;
  if (n === 0) return "Posted today";
  if (n === 1) return "Posted yesterday";
  if (n < 7) return `Posted ${n} days ago`;
  if (n < 60) { const w = Math.floor(n / 7); return `Posted ${w} week${w > 1 ? "s" : ""} ago`; }
  return `Posted ${formatShortDate(iso, new Date(iso).getFullYear() !== new Date().getFullYear())}`;
}
export function isNewPosting(iso: string | null | undefined) {
  if (!iso) return false; const n = daysAgo(iso); return n !== null && n <= 2;
}

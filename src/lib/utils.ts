import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, resolving Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format cents as currency. */
export function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/** Format a fraction as a signed percentage, e.g. 0.1234 -> "+12.3%". */
export function formatPercent(fraction: number, digits = 1) {
  const pct = fraction * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}

/** Compact number formatting for dashboard tiles: 12345 -> "12.3k". */
export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

/** Human-friendly relative time: "3 days ago". */
export function formatRelative(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["week", 604800000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
  ];

  for (const [unit, ms] of units) {
    if (abs >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return "just now";
}

/** Format a date range as "Mar 1 – Mar 31, 2026". */
export function formatDateRange(start: Date | string, end: Date | string) {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (s.getFullYear() !== e.getFullYear()) {
    opts.year = "numeric";
  }
  const sameYear = s.getFullYear() === e.getFullYear();
  const sStr = new Intl.DateTimeFormat("en-US", opts).format(s);
  const eStr = new Intl.DateTimeFormat("en-US", {
    ...opts,
    year: sameYear ? undefined : "numeric",
  }).format(e);
  return `${sStr} – ${eStr}`;
}

/** Clamp a number into a range. */
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** Slugify a string for URLs. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

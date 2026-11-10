"use client";

import * as React from "react";

/**
 * Relative time, rendered on the client.
 *
 * Why not the server? Because `formatRelative` reads the clock, and Next.js
 * 16's Cache Components treat a clock read during prerender as unstable
 * input, it fails the build. Rendering it client-side is both correct and
 * a nicer experience: the time keeps ticking without a refresh.
 */
export function RelativeTime({
  value,
  className,
}: {
  value: string | number | Date;
  className?: string;
}) {
  const [text, setText] = React.useState("just now");

  React.useEffect(() => {
    const format = () => {
      const date =
        value instanceof Date ? value : new Date(value as string | number);
      const diffMs = date.getTime() - Date.now();
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

      let out = "just now";
      for (const [unit, ms] of units) {
        if (abs >= ms) {
          out = rtf.format(Math.round(diffMs / ms), unit);
          break;
        }
      }
      setText(out);
    };

    format();
    const timer = setInterval(format, 60_000);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <time className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}

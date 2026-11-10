"use client";

import * as React from "react";
import { cn, formatCompact } from "@/lib/utils";

/**
 * Hand-rolled SVG area chart.
 *
 * No chart library on purpose: the shape we want is a soft, rounded area with a
 * pastel gradient, and a dependency would cost more than the ~150 lines below.
 *
 * The container is measured with a ResizeObserver so the SVG can be drawn in
 * real pixel space, that keeps the hover marker round, the axis text crisp,
 * and the tooltip anchored exactly, at any width.
 */

export interface TrendPoint {
  date: string;
  value: number;
}

export interface TrendChartProps {
  points: TrendPoint[];
  /** Pastel accent name: mint | peach | sky | butter | lilac. */
  accent?: string;
  /** Rendered height in pixels. Width is fluid. */
  height?: number;
  /** Accessible label for the chart as a whole. */
  label?: string;
  /**
   * How the tooltip renders the value. A named option rather than a callback,
   * so the component stays usable from a server component.
   */
  valueFormat?: "compact" | "number" | "clicks";
  className?: string;
}

const ACCENT_VARS: Record<string, string> = {
  mint: "var(--mint)",
  peach: "var(--peach)",
  sky: "var(--sky)",
  butter: "var(--butter)",
  lilac: "var(--lilac)",
};

const PAD_TOP = 18;
const PAD_BOTTOM = 26;
const PAD_X = 10;

function shortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Turns a polyline into a smooth cubic path using control points derived from
 * the neighbouring samples. Falls back to straight lines for short series.
 */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function formatValueFor(value: number, mode: "compact" | "number" | "clicks") {
  if (mode === "clicks") {
    return `${Math.round(value).toLocaleString("en-US")} clicks`;
  }
  if (mode === "number") {
    return Math.round(value).toLocaleString("en-US");
  }
  return formatCompact(value);
}

export function TrendChart({
  points,
  accent = "sky",
  height = 200,
  label = "Trend over time",
  valueFormat = "compact",
  className,
}: TrendChartProps) {
  const [active, setActive] = React.useState<number | null>(null);
  const [width, setWidth] = React.useState(640);
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const gradientId = React.useId();

  const color = ACCENT_VARS[accent] ?? ACCENT_VARS.sky;

  // Track the container width so the chart can be drawn in pixel space.
  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = React.useMemo(
    () => points.filter((p) => Number.isFinite(p.value)),
    [points],
  );

  const geometry = React.useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map((p) => p.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    // A flat series would collapse to a zero-height band; give it some room.
    const span = rawMax - rawMin || Math.max(Math.abs(rawMax) * 0.2, 1);
    const min = rawMin - span * 0.15;
    const max = rawMax + span * 0.15;

    const innerWidth = Math.max(width - PAD_X * 2, 10);
    const innerHeight = Math.max(height - PAD_TOP - PAD_BOTTOM, 10);

    const coords = data.map((p, i) => {
      const x =
        data.length === 1
          ? PAD_X + innerWidth / 2
          : PAD_X + (i / (data.length - 1)) * innerWidth;
      const ratio = (p.value - min) / (max - min || 1);
      const y = PAD_TOP + innerHeight - ratio * innerHeight;
      return { x, y };
    });

    return { coords, min, max };
  }, [data, width, height]);

  const labelIndexes = React.useMemo(() => {
    if (data.length === 0) return [];
    if (data.length === 1) return [0];
    if (data.length === 2) return [0, 1];
    return [0, Math.floor((data.length - 1) / 2), data.length - 1];
  }, [data.length]);

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg || !geometry) return;

    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;

    const x = event.clientX - rect.left;
    const { coords } = geometry;

    let nearest = 0;
    let best = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const dist = Math.abs(coords[i].x - x);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    }
    setActive(nearest);
  }

  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    if (!geometry || geometry.coords.length === 0) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActive((prev) => {
        const base = prev ?? (step > 0 ? -1 : geometry.coords.length);
        return Math.min(geometry.coords.length - 1, Math.max(0, base + step));
      });
    } else if (event.key === "Escape") {
      setActive(null);
    }
  }

  if (!geometry || data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-control border border-dashed border-rule",
          "bg-paper-3/40 px-4 text-center text-sm text-muted",
          className,
        )}
        style={{ height }}
      >
        No numbers to plot yet, they&apos;ll show up as soon as there&apos;s traffic.
      </div>
    );
  }

  const { coords } = geometry;
  const linePath = smoothPath(coords);
  const baseline = height - PAD_BOTTOM;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${baseline} L ${coords[0].x.toFixed(2)} ${baseline} Z`;

  const activePoint = active !== null ? data[active] : null;
  const activeCoord = active !== null ? coords[active] : null;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
        tabIndex={0}
        onPointerMove={handleMove}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={handleKeyDown}
        className="block h-auto w-full touch-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal guide lines */}
        {[0, 0.5, 1].map((t) => {
          const y = PAD_TOP + t * (height - PAD_TOP - PAD_BOTTOM);
          return (
            <line
              key={t}
              x1={PAD_X}
              x2={Math.max(width - PAD_X, PAD_X)}
              y1={y}
              y2={y}
              stroke="var(--line)"
              strokeWidth={1}
              strokeDasharray={t === 1 ? undefined : "4 6"}
            />
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End-of-series marker */}
        {coords.length > 1 && (
          <circle
            cx={coords[coords.length - 1].x}
            cy={coords[coords.length - 1].y}
            r={4}
            fill={color}
            stroke="var(--color-paper)"
            strokeWidth={2}
          />
        )}

        {/* Hover marker */}
        {activeCoord && (
          <>
            <line
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={PAD_TOP - 6}
              y2={baseline}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="3 4"
            />
            <circle
              cx={activeCoord.x}
              cy={activeCoord.y}
              r={6}
              fill={color}
              stroke="var(--color-paper)"
              strokeWidth={2.5}
            />
          </>
        )}

        {/* Axis labels: first / middle / last */}
        {labelIndexes.map((i) => {
          const x = coords[i].x;
          const anchor =
            i === 0 ? "start" : i === data.length - 1 ? "end" : "middle";
          return (
            <text
              key={i}
              x={x}
              y={height - 8}
              textAnchor={anchor}
              fill="var(--ink-faint)"
              fontSize={11}
              fontWeight={600}
            >
              {shortDate(data[i].date)}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {activePoint && activeCoord && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full animate-rise rounded-control border border-rule bg-paper-2 px-3 py-2 shadow-card"
          style={{
            left: `${activeCoord.x}px`,
            top: `${activeCoord.y - 12}px`,
          }}
          role="status"
        >
          <p className="whitespace-nowrap text-[11px] font-bold text-muted">
            {fullDate(activePoint.date)}
          </p>
          <p className="whitespace-nowrap font-display text-sm font-bold text-ink">
            {formatValueFor(activePoint.value, valueFormat)}
          </p>
        </div>
      )}
    </div>
  );
}

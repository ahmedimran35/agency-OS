"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/icons";

/**
 * Brightside shared kit.
 *
 * A light, warm-ivory ground. Surfaces are separated by a visible hairline
 * and a soft shadow, so everything reads as a distinct object rather than a
 * flat wash. Motion is short and calm: a lift on hover, a settle on enter.
 *
 * The rule this file enforces: nothing here is a card inside a card, no label
 * is set in tracked capitals, and no emoji is ever used as an icon.
 */

// ---------- Surfaces ----------

/**
 * A card. One hairline and one soft shadow, never both heavy. This is the
 * default container for a group of content.
 */
export function Card({
  className,
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-rule bg-paper-raised shadow-card",
        "transition-[transform,box-shadow,border-color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
        interactive &&
          "hover:-translate-y-1 hover:border-line-strong hover:shadow-lift active:translate-y-0",
        className,
      )}
      {...props}
    />
  );
}

/** A tile: the ground one step deeper, no border, for a region inside a card. */
export function Tile({
  className,
  as: As = "div",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { as?: React.ElementType }) {
  return (
    <As className={cn("rounded-card bg-paper-2 text-ink", className)} {...props} />
  );
}

/** A sunk well: one step deeper again, for a region inside a tile. */
export function Well({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-card bg-paper-3 text-ink", className)} {...props} />
  );
}

/**
 * The one raised surface: a document the client receives, lifted off the
 * page. Once per screen at most.
 */
export function RaisedCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-rule bg-paper-raised shadow-lift",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-title font-extrabold tracking-tight text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm leading-relaxed text-ink-2", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-3 p-5 pt-0", className)} {...props} />
  );
}

// ---------- Button ----------

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "soft"
  // Legacy names kept so screens mid-migration keep compiling.
  | "outline"
  | "mint"
  | "peach"
  | "sky"
  | "butter"
  | "lilac";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-ink border-accent hover:bg-accent-2 hover:border-accent-2 hover:-translate-y-px hover:shadow-lift",
  secondary:
    "bg-paper-raised text-ink border-rule hover:border-line-strong hover:bg-paper-2 hover:-translate-y-px hover:shadow-card",
  soft: "bg-accent-soft text-accent-text border-transparent hover:-translate-y-px",
  ghost:
    "bg-transparent text-ink-2 border-transparent hover:bg-paper-2 hover:text-ink",
  danger:
    "bg-transparent text-error-text border-error/40 hover:bg-error hover:border-error hover:text-error-ink",
  // Legacy names kept so screens mid-migration keep compiling. A "mint"
  // button was a primary action, so it takes the accent.
  outline: "bg-paper-raised text-ink border-rule hover:bg-paper-2",
  mint: "bg-accent text-accent-ink border-accent hover:bg-accent-2 hover:border-accent-2 hover:-translate-y-px hover:shadow-lift",
  peach: "bg-accent text-accent-ink border-accent hover:bg-accent-2 hover:border-accent-2 hover:-translate-y-px hover:shadow-lift",
  sky: "bg-accent text-accent-ink border-accent hover:bg-accent-2 hover:border-accent-2 hover:-translate-y-px hover:shadow-lift",
  butter: "bg-accent text-accent-ink border-accent hover:bg-accent-2 hover:border-accent-2 hover:-translate-y-px hover:shadow-lift",
  lilac: "bg-accent text-accent-ink border-accent hover:bg-accent-2 hover:border-accent-2 hover:-translate-y-px hover:shadow-lift",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", type = "button", ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-control border font-bold",
        "transition-[transform,background-color,border-color,color,box-shadow]",
        "duration-[var(--dur-short)] ease-[var(--ease-out)]",
        "active:translate-y-0 active:shadow-none",
        "disabled:pointer-events-none disabled:opacity-55",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

// ---------- Badge / chip ----------

export type BadgeTone =
  | "neutral"
  | "accent"
  | "sunken"
  | "raised"
  | "error"
  | "success"
  // Legacy names kept so screens mid-migration keep compiling.
  | "mint"
  | "peach"
  | "sky"
  | "butter"
  | "lilac"
  | "warning"
  | "danger";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-paper-3 text-ink-2 border-transparent",
  accent: "bg-accent-soft text-accent-text border-accent/20",
  sunken: "bg-paper-3 text-ink-2 border-transparent",
  raised: "bg-paper-raised text-ink border-rule",
  error: "bg-error text-error-ink border-error/30",
  success: "bg-success text-success-ink border-success/40",
  // Legacy names map onto the pastel washes.
  mint: "bg-mint text-ink border-transparent",
  peach: "bg-peach text-ink border-transparent",
  sky: "bg-sky text-ink border-transparent",
  butter: "bg-butter text-ink border-transparent",
  lilac: "bg-lilac text-ink border-transparent",
  warning: "bg-butter text-ink border-transparent",
  danger: "bg-error text-error-ink border-error/30",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5",
        "text-xs font-bold whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

// ---------- Form controls ----------

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-control border border-rule bg-paper-raised px-3.5 text-sm",
      "text-ink placeholder:text-muted",
      "transition-[border-color,box-shadow] duration-[var(--dur-micro)]",
      "hover:border-line-strong",
      "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15",
      "disabled:cursor-not-allowed disabled:opacity-55",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-control border border-rule bg-paper-raised px-3.5 py-3 text-sm",
      "text-ink placeholder:text-muted",
      "transition-[border-color,box-shadow] duration-[var(--dur-micro)]",
      "hover:border-line-strong",
      "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15",
      "disabled:cursor-not-allowed disabled:opacity-55",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-control border border-rule bg-paper-raised px-3 text-sm",
      "text-ink transition-[border-color,box-shadow] duration-[var(--dur-micro)]",
      "hover:border-line-strong",
      "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15",
      "disabled:cursor-not-allowed disabled:opacity-55",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("mb-1.5 block text-sm font-bold text-ink-2", className)}
    {...props}
  />
));
Label.displayName = "Label";

/** Helper text keeps its space reserved so a field never jumps. */
export function Hint({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1.5 min-h-[1lh] text-xs text-muted", className)}
      {...props}
    />
  );
}

// ---------- Avatar ----------

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-16 w-16 text-lg",
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover ring-1 ring-rule",
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display font-bold text-ink",
        "bg-accent-soft ring-1 ring-accent/15",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}


/**
 * A figure that counts up when it appears.
 *
 * The number is in the DOM from the first frame, so it is readable without
 * scripting and by a screen reader. The animation only changes what a
 * sighted reader sees, and it stops at the real value.
 */
const FORMATTERS: Record<string, (n: number) => string> = {
  plain: (n) => n.toLocaleString("en-US"),
  currency: (n) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n),
  percent: (n) => `${n.toFixed(1)}%`,
};

export function CountUp({
  value,
  format,
  durationMs = 700,
  className,
}: {
  value: number;
  /** Formats the number for display. */
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
}) {
  const formatFn = format ?? ((n: number) => n.toLocaleString("en-US"));
  const [shown, setShown] = React.useState(value);
  const ref = React.useRef<HTMLSpanElement>(null);
  const done = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || done.current) {
      setShown(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const step = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / durationMs, 1);
      // An ease-out, so it settles rather than stops.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(value * eased);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        done.current = true;
        setShown(value);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {formatFn(shown)}
    </span>
  );
}

// ---------- Stat row ----------

/**
 * A stat is a title that never wraps and a figure. No icon, ever.
 * Sibling stats part with a hairline rather than a gap.
 */
export function Stat({
  label,
  value,
  delta,
  hint,
  numeric,
  formatNumber,
  className,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  /** The figure as a number, so it can count up. */
  numeric?: number;
  /** How to render the figure while it counts. A named kind, so a server
   *  component can pass it without sending a function across the wire. */
  formatNumber?: "currency" | "plain" | "percent";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-sm font-bold text-muted">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold tracking-tight text-ink num">
          {numeric === undefined ? (
            value
          ) : (
            <CountUp value={numeric} format={FORMATTERS[formatNumber ?? "plain"]} />
          )}
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              "text-sm font-bold",
              delta >= 0 ? "text-success-text" : "text-error-text",
            )}
          >
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta * 100).toFixed(1)}%
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** A row of stats parted by hairlines, not by gaps. */
export function StatRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <dl
      className={cn(
        "grid gap-y-6 divide-y divide-rule sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((child, i) => (
        <div
          key={i}
          className={cn(
            "sm:border-l sm:border-rule sm:pl-8 sm:first:border-l-0 sm:first:pl-0",
          )}
        >
          {child}
        </div>
      ))}
    </dl>
  );
}

// ---------- Progress ----------

export function Progress({
  value,
  tone = "accent",
  accent,
  className,
}: {
  value: number;
  tone?: "accent" | "success" | "error" | "ink";
  /** Transitional: the old per-client accent name. */
  accent?: string;
  className?: string;
}) {
  const bar = {
    accent: "bg-accent",
    success: "bg-success-text",
    error: "bg-error-text",
    ink: "bg-ink",
  }[tone];

  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-pill bg-paper-3", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-pill origin-left transition-transform duration-[var(--dur-short)] ease-[var(--ease-out)]",
          bar,
        )}
        style={{ transform: `scaleX(${Math.min(Math.max(value, 0), 100) / 100})` }}
      />
    </div>
  );
}

// ---------- Health dial (the signature) ----------

/**
 * The client health dial. One number, one ring, read at a glance down a
 * column. The track is a pale well; the arc is the accent.
 */
export function HealthDial({
  score,
  size = 64,
  accent,
  className,
}: {
  score: number;
  size?: number;
  /** Transitional: the old per-client accent name. */
  accent?: string;
  className?: string;
}) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  const arc =
    clamped >= 75
      ? "var(--color-accent)"
      : clamped >= 50
        ? "var(--color-ink-2)"
        : "var(--color-error-text)";

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Health score ${Math.round(clamped)} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-paper-3)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={arc}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ "--dash-length": circumference } as React.CSSProperties}
          className="animate-draw"
        />
      </svg>
      <span className="absolute font-display text-sm font-extrabold text-ink num">
        {Math.round(clamped)}
      </span>
    </div>
  );
}

// ---------- Empty state ----------

export function EmptyState({
  title,
  description,
  action,
  icon,
  emoji,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** A lucide icon node, or an icon name from the shared registry. */
  icon?: React.ReactNode | string;
  /** Transitional: emoji passed by screens still mid-migration. */
  emoji?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-rule bg-paper-2/60 px-6 py-12 text-center",
        className,
      )}
    >
      {(icon || emoji) && (
        <span className="flex h-11 w-11 items-center justify-center rounded-control bg-paper-raised text-ink-2 ring-1 ring-rule">
          {typeof icon === "string" ? (
            <Icon name={icon as IconName} className="h-5 w-5" />
          ) : (
            icon
          )}
        </span>
      )}
      <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-muted text-balance">
          {description}
        </p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

/** A skeleton in the shape of what is coming. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-control bg-paper-3", className)}
      aria-hidden
    />
  );
}

// ---------- Section heading ----------

/**
 * A section opens on its heading. No eyebrow, no tracked caps: the label
 * rides the heading block itself.
 */
export function SectionHeading({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** An icon name from the shared registry. */
  icon?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2.5 font-display text-section font-extrabold text-ink">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent-soft">
              <Icon name={icon as IconName} className="h-4 w-4 text-accent-text" />
            </span>
          )}
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-prose text-sm text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ---------- Tabs (a strip, not a stack of pills) ----------

export function TabStrip({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-rule",
        className,
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-bold",
              "-mb-px transition-colors duration-[var(--dur-micro)]",
              selected
                ? "border-accent text-accent-text"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Toast ----------

export type ToastTone = "info" | "success" | "error";

export function Toast({
  message,
  tone = "info",
  onDismiss,
  className,
}: {
  message: string;
  tone?: ToastTone;
  onDismiss?: () => void;
  className?: string;
}) {
  const toneClass = {
    info: "bg-ink text-paper",
    success: "bg-success text-success-ink",
    error: "bg-error text-error-ink",
  }[tone];

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-3 rounded-control px-4 py-3 text-sm font-bold shadow-lift",
        toneClass,
        className,
      )}
    >
      <span className="min-w-0 flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-control px-2 py-1 text-xs font-bold underline underline-offset-2"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

/**
 * `HealthRing` is the old name for the health dial, and `StatTile` the old
 * name for the stat block. The dial is the design's signature element, so
 * the old imports keep working.
 */
export const HealthRing = HealthDial;

export function StatTile({
  label,
  value,
  delta,
  hint,
  accent,
  numeric,
  formatNumber,
  className,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  /** Transitional: the old per-client accent name. */
  accent?: string;
  /** The figure as a number, so it can count up. */
  numeric?: number;
  formatNumber?: "currency" | "plain" | "percent";
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-rule bg-paper-raised p-5", className)}>
      <Stat
        label={label}
        value={value}
        delta={delta}
        hint={hint}
        numeric={numeric}
        formatNumber={formatNumber}
      />
    </div>
  );
}

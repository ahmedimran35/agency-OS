"use client";

import { Icon, type IconName } from "@/components/icons";
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A tiny, friendly toast system.
 *
 * Deliberately local: the shared UI kit has no toast primitive, and the app
 * shell layout is off-limits, so each page that wants toasts wraps its own
 * subtree in <ToastProvider>.
 */

export type ToastTone = "mint" | "peach" | "sky" | "butter" | "lilac" | "danger";

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** An icon name from the shared registry. */
  icon?: string;
  /** Milliseconds before auto-dismiss. 0 keeps it until dismissed. */
  duration?: number;
}

interface ToastEntry extends ToastOptions {
  id: string;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  mint: "bg-paper-2",
  peach: "bg-paper-3",
  sky: "bg-paper-2",
  butter: "bg-paper-3",
  lilac: "bg-paper-2",
  danger: "bg-paper-3",
};

const ACCENT_STYLES: Record<ToastTone, string> = {
  mint: "bg-paper-3",
  peach: "bg-accent",
  sky: "bg-paper-2",
  butter: "bg-paper-3",
  lilac: "bg-paper-3",
  danger: "bg-danger",
};

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback(
    (options: ToastOptions) => {
      counter += 1;
      const id = `toast_${counter}`;
      const entry: ToastEntry = { tone: "mint", ...options, id };
      setToasts((prev) => [...prev.slice(-2), entry]);
      const duration = options.duration ?? 4500;
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((timer) => clearTimeout(timer));
      map.clear();
    };
  }, []);

  const value = React.useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-3 bottom-3 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-3",
              "rounded-card border border-rule bg-paper-2 p-3.5 shadow-card",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-base",
                TONE_STYLES[t.tone ?? "mint"],
              )}
              aria-hidden
            >
              <Icon name={(t.icon as IconName) ?? "sparkle"} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
                  {t.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 -mt-1 rounded-control p-1 text-muted transition-colors hover:bg-paper-3 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}

/** Small helper for the accent stripe on a toast card. */
export function ToastAccent({ tone = "mint" }: { tone?: ToastTone }) {
  return (
    <span
      className={cn("h-full w-1 shrink-0 rounded-full", ACCENT_STYLES[tone])}
      aria-hidden
    />
  );
}

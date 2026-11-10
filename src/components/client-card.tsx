import Link from "next/link";
import { ArrowUpRight, Globe } from "lucide-react";
import type { Client, ClientMetrics } from "@/lib/types";
import { CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/types";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import { Avatar, Badge, Card, HealthRing, type BadgeTone } from "@/components/ui";

/**
 * Shared client card, used by the roster grid and anywhere else a client
 * needs a compact, linkable summary.
 */

const STATUS_TONES: Record<ClientStatus, BadgeTone> = {
  ACTIVE: "success",
  ONBOARDING: "sky",
  PAUSED: "butter",
  CHURNED: "danger",
};

/** Exported so pages can keep their own status chips consistent with this card. */
export function clientStatusTone(status: ClientStatus): BadgeTone {
  return STATUS_TONES[status];
}

export interface ClientCardProps {
  client: Client;
  /** Optional metrics used for the quick-stats strip. */
  metrics?: ClientMetrics | null;
  className?: string;
  /** Stagger index for the entrance animation. */
  index?: number;
}

export function ClientCard({
  client,
  metrics,
  className,
  index = 0,
}: ClientCardProps) {
  return (
    <Link
      href={`/clients/${client.slug}`}
      className={cn(
        "group block rounded-card outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus",
        "animate-rise transition-[transform,box-shadow] duration-[var(--dur-short)] ease-[var(--ease-out)]",
        "hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <Card interactive className="h-full overflow-hidden group-hover:translate-y-0">
        {/* Accent strip keyed to the client's own colour */}
        <div
          className={cn(
            "h-1.5 w-full",
            {
              mint: "bg-mint",
              peach: "bg-peach",
              sky: "bg-sky",
              butter: "bg-butter",
              lilac: "bg-lilac",
            }[client.color],
          )}
        />

        <div className="p-5">
          <div className="flex items-start gap-3">
            <Avatar name={client.name} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate font-display text-base font-bold text-ink">
                  {client.name}
                </h3>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </div>
              <p className="mt-0.5 truncate text-xs text-ink-2">
                {client.industry ?? "Industry TBD"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Badge tone={STATUS_TONES[client.status]}>
              {CLIENT_STATUS_LABELS[client.status]}
            </Badge>
            <span className="font-display text-sm font-bold text-ink">
              {formatCurrency(client.retainerCents)}
              <span className="ml-1 text-[11px] font-bold text-muted">
                /mo
              </span>
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-rule pt-4">
            <HealthRing
              score={client.healthScore}
              size={48}
              accent={client.color}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-muted">
                Health
              </p>
              <p className="text-xs text-ink-2">
                {client.healthScore >= 80
                  ? "Thriving. Keep the streak going."
                  : client.healthScore >= 60
                    ? "Doing fine, worth a nudge."
                    : "Slipping. Schedule a check-in."}
              </p>
            </div>
          </div>

          {metrics ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-control bg-paper-3 px-3 py-2">
                <p className="text-[11px] font-bold text-muted">Visitors</p>
                <p className="font-display text-sm font-bold text-ink">
                  {formatCompact(metrics.visitors)}
                </p>
              </div>
              <div className="rounded-control bg-paper-3 px-3 py-2">
                <p className="text-[11px] font-bold text-muted">Clicks</p>
                <p className="font-display text-sm font-bold text-ink">
                  {formatCompact(metrics.clicks)}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-control bg-paper-2 px-3 py-2 text-xs text-ink-2">
              <Globe className="h-3.5 w-3.5" aria-hidden />
              Metrics are still finding their way here.
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

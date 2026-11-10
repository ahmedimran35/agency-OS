"use client";

import * as React from "react";
import { ArrowRight, GripVertical, Handshake, Target } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Progress,
  SectionHeading,
  StatTile,
} from "@/components/ui";
import { ToastProvider, useToast } from "@/components/agency-toast";
import { cn, formatCurrency, formatRelative } from "@/lib/utils";
import {
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  type Client,
  type Deal,
  type DealStage,
} from "@/lib/types";
import { updateDealStage } from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Stage theming                                                      */
/* ------------------------------------------------------------------ */

type Accent = "mint" | "peach" | "sky" | "butter" | "lilac";

/** Stage → pastel accent. LOST deliberately stays neutral. */
const STAGE_ACCENT: Record<DealStage, Accent | "neutral"> = {
  LEAD: "sky",
  QUALIFIED: "lilac",
  PROPOSAL: "butter",
  NEGOTIATION: "peach",
  WON: "mint",
  LOST: "neutral",
};

const STAGE_TINT: Record<DealStage, string> = {
  LEAD: "bg-paper-2",
  QUALIFIED: "bg-paper-2",
  PROPOSAL: "bg-paper-3",
  NEGOTIATION: "bg-paper-3",
  WON: "bg-paper-2",
  LOST: "bg-paper-3",
};

const STAGE_BAR: Record<DealStage, string> = {
  LEAD: "bg-paper-2",
  QUALIFIED: "bg-paper-3",
  PROPOSAL: "bg-paper-3",
  NEGOTIATION: "bg-accent",
  WON: "bg-paper-3",
  LOST: "bg-paper-3",
};

/** `Progress` has no neutral swatch, so LOST borrows the soft red. */
const STAGE_PROGRESS: Record<DealStage, "mint" | "peach" | "sky" | "butter" | "lilac" | "danger"> = {
  LEAD: "sky",
  QUALIFIED: "lilac",
  PROPOSAL: "butter",
  NEGOTIATION: "peach",
  WON: "mint",
  LOST: "danger",
};

const STAGE_ICON: Record<DealStage, string> = {
  LEAD: "new",
  QUALIFIED: "search",
  PROPOSAL: "document",
  NEGOTIATION: "deal",
  WON: "party",
  LOST: "rain",
};

/* ------------------------------------------------------------------ */
/* Small helpers                                                      */
/* ------------------------------------------------------------------ */

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const selectClass =
  "h-9 w-full cursor-pointer appearance-none rounded-control border border-rule bg-paper-2 px-3 pr-8 text-xs font-bold text-ink transition-colors hover:border-rule focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

/* ------------------------------------------------------------------ */
/* Board                                                              */
/* ------------------------------------------------------------------ */

function PipelineBoardInner({
  clients,
  initialDeals,
}: {
  clients: Client[];
  initialDeals: Deal[];
}) {
  const { toast } = useToast();
  const [deals, setDeals] = React.useState<Deal[]>(initialDeals);
  const [clientFilter, setClientFilter] = React.useState<string>("all");
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<DealStage | null>(null);
  const [busyDealId, setBusyDealId] = React.useState<string | null>(null);

  const clientName = React.useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client",
    [clients],
  );

  const visibleDeals = React.useMemo(
    () =>
      clientFilter === "all"
        ? deals
        : deals.filter((d) => d.clientId === clientFilter),
    [deals, clientFilter],
  );

  const byStage = React.useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    for (const stage of DEAL_STAGES) map.set(stage, []);
    for (const deal of visibleDeals) map.get(deal.stage)?.push(deal);
    for (const list of map.values()) {
      list.sort((a, b) => b.valueCents - a.valueCents);
    }
    return map;
  }, [visibleDeals]);

  /* ---------------- stats ---------------- */

  const stats = React.useMemo(() => {
    const open = deals.filter((d) => d.stage !== "WON" && d.stage !== "LOST");
    const openValue = open.reduce((sum, d) => sum + d.valueCents, 0);
    const weighted = open.reduce(
      (sum, d) => sum + Math.round(d.valueCents * d.probability),
      0,
    );
    const won = deals.filter((d) => d.stage === "WON").length;
    const lost = deals.filter((d) => d.stage === "LOST").length;
    const closed = won + lost;
    const winRate = closed === 0 ? null : won / closed;
    return { openValue, weighted, winRate, openCount: open.length, won, lost, closed };
  }, [deals]);

  /* ---------------- stage mutation ---------------- */

  const moveDeal = React.useCallback(
    async (dealId: string, stage: DealStage) => {
      const deal = deals.find((d) => d.id === dealId);
      if (!deal || deal.stage === stage) return;

      const previousStage = deal.stage;

      // Optimistic: move it now, fix it later if the write fails.
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage } : d)),
      );
      setBusyDealId(dealId);

      try {
        const updated = await updateDealStage(dealId, stage);
        if (!updated) throw new Error("Deal not found");
        toast({
          title: `${deal.title} moved to ${DEAL_STAGE_LABELS[stage]}`,
          tone: STAGE_ACCENT[stage] === "neutral" ? "butter" : STAGE_ACCENT[stage],
          icon: STAGE_ICON[stage],
        });
      } catch {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === dealId ? { ...d, stage: previousStage } : d,
          ),
        );
        toast({
          title: "That move didn’t stick",
          description: "We put the deal back where it was. Try again in a moment.",
          tone: "danger",
          icon: "notFound",
        });
      } finally {
        setBusyDealId(null);
      }
    },
    [deals, toast],
  );

  /* ---------------- drag & drop ---------------- */

  const handleDragStart = (
    event: React.DragEvent<HTMLElement>,
    dealId: string,
  ) => {
    event.dataTransfer.setData("text/plain", dealId);
    event.dataTransfer.effectAllowed = "move";
    setDraggingId(dealId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDragOver = (
    event: React.DragEvent<HTMLElement>,
    stage: DealStage,
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dropTarget !== stage) setDropTarget(stage);
  };

  const handleDrop = (
    event: React.DragEvent<HTMLElement>,
    stage: DealStage,
  ) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    setDropTarget(null);
    setDraggingId(null);
    if (id) void moveDeal(id, stage);
  };

  /* ---------------- render ---------------- */

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="launch"
        title="Pipeline"
        description="Every deal, from first hello to signed. Drag a card to move it along."
        action={
          <div className="w-full sm:w-56">
            <label
              htmlFor="pipeline-client-filter"
              className="mb-1.5 block text-xs font-bold text-ink-2"
            >
              Filter by client
            </label>
            <select
              id="pipeline-client-filter"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Open pipeline"
          value={formatCurrency(stats.openValue)}
          hint={`${stats.openCount} deal${stats.openCount === 1 ? "" : "s"} still in play`}
          accent="sky"
        />
        <StatTile
          label="Weighted value"
          value={formatCurrency(stats.weighted)}
          hint="Value adjusted for how likely each deal is"
          accent="lilac"
        />
        <StatTile
          label="Win rate"
          value={stats.winRate === null ? "," : `${Math.round(stats.winRate * 100)}%`}
          hint={
            stats.closed === 0
              ? "No deals closed yet"
              : `${stats.won} won of ${stats.closed} closed`
          }
          accent="mint"
        />
      </div>

      <div className="animate-rise">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-muted">
          <GripVertical className="h-3.5 w-3.5" aria-hidden />
          <span>
            Drag cards between columns, or use the menu on any card to move it.
          </span>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-4">
            {DEAL_STAGES.map((stage, stageIndex) => {
              const stageDeals = byStage.get(stage) ?? [];
              const stageValue = stageDeals.reduce(
                (sum, d) => sum + d.valueCents,
                0,
              );
              const isDropTarget = dropTarget === stage;

              return (
                <section
                  key={stage}
                  aria-label={`${DEAL_STAGE_LABELS[stage]} column`}
                  className="animate-rise flex w-[290px] shrink-0 flex-col"
                  style={{ animationDelay: `${stageIndex * 60}ms` }}
                  onDragOver={(e) => handleDragOver(e, stage)}
                  onDragEnter={(e) => handleDragOver(e, stage)}
                  onDragLeave={(e) => {
                    if (
                      e.currentTarget.contains(
                        e.relatedTarget as Node | null,
                      )
                    ) {
                      return;
                    }
                    setDropTarget((prev) => (prev === stage ? null : prev));
                  }}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-card border px-3.5 py-2.5 transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                      STAGE_TINT[stage],
                      "border-rule",
                      isDropTarget && "ring-2 ring-accent ring-offset-2 ring-offset-paper",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span aria-hidden className="text-sm">
                        {STAGE_ICON[stage]}
                      </span>
                      <h2 className="truncate font-display text-sm font-bold text-ink">
                        {DEAL_STAGE_LABELS[stage]}
                      </h2>
                      <Badge
                        tone="neutral"
                        className="bg-paper-2/70 text-ink-2"
                      >
                        {stageDeals.length}
                      </Badge>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-ink-2">
                      {formatCurrency(stageValue)}
                    </span>
                  </div>

                  <div className="mt-3 min-h-[140px] space-y-3">
                    {stageDeals.length === 0 ? (
                      <div
                        className={cn(
                          "rounded-card border border-dashed border-rule bg-paper-3/40 px-4 py-8 text-center transition-colors",
                          isDropTarget && "bg-paper-2/60",
                        )}
                      >
                        <p className="text-sm font-bold text-ink-2">
                          Nothing here yet
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Drag a deal over to put it in motion.
                        </p>
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <DealCard
                          key={deal.id}
                          deal={deal}
                          clientName={clientName(deal.clientId)}
                          dragging={draggingId === deal.id}
                          busy={busyDealId === deal.id}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onMove={moveDeal}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Deal card                                                          */
/* ------------------------------------------------------------------ */

function DealCard({
  deal,
  clientName,
  dragging,
  busy,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  deal: Deal;
  clientName: string;
  dragging: boolean;
  busy: boolean;
  onDragStart: (event: React.DragEvent<HTMLElement>, id: string) => void;
  onDragEnd: () => void;
  onMove: (id: string, stage: DealStage) => void | Promise<void>;
}) {
  const probabilityPct = Math.round(deal.probability * 100);
  const closed = deal.stage === "WON" || deal.stage === "LOST";

  return (
    <article
      draggable={!busy}
      onDragStart={(e) => onDragStart(e, deal.id)}
      onDragEnd={onDragEnd}
      aria-label={`${deal.title}, ${formatCurrency(deal.valueCents)}`}
      className={cn(
        "group relative overflow-hidden rounded-card border border-rule bg-paper-2 shadow-card transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
        "hover:-translate-y-0.5 hover:shadow-card",
        dragging && "rotate-1 opacity-60",
        busy && "opacity-70",
      )}
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1.5", STAGE_BAR[deal.stage])}
        aria-hidden
      />

      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-sm leading-snug font-bold text-ink">
            {deal.title}
          </h3>
          <GripVertical
            className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-muted opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-ink-2">
          <Handshake className="h-3 w-3 shrink-0 text-muted" aria-hidden />
          {clientName}
        </p>

        <p className="mt-2.5 font-display text-lg font-bold text-ink">
          {formatCurrency(deal.valueCents)}
        </p>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
            <span className="text-muted">Likelihood</span>
            <span className="text-ink">{probabilityPct}%</span>
          </div>
          <Progress
            value={probabilityPct}
            accent={STAGE_PROGRESS[deal.stage]}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-3">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-2">
            <Target className="h-3 w-3 shrink-0 text-muted" aria-hidden />
            {deal.expectedClose ? (
              <>
                {shortDate.format(deal.expectedClose)}
                <span className="font-normal text-muted">
                  ({formatRelative(deal.expectedClose)})
                </span>
              </>
            ) : (
              <span className="font-normal text-muted">No date yet</span>
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label
            htmlFor={`stage-${deal.id}`}
            className="sr-only"
          >
            Stage for {deal.title}
          </label>
          <select
            id={`stage-${deal.id}`}
            value={deal.stage}
            disabled={busy}
            onChange={(e) => {
              void onMove(deal.id, e.target.value as DealStage);
            }}
            className={cn(selectClass, "h-8 flex-1")}
          >
            {DEAL_STAGES.map((s) => (
              <option key={s} value={s}>
                {DEAL_STAGE_LABELS[s]}
              </option>
            ))}
          </select>
          <ArrowRight
            className="h-3.5 w-3.5 shrink-0 text-muted"
            aria-hidden
          />
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Empty board                                                        */
/* ------------------------------------------------------------------ */

function PipelineBoard({
  clients,
  initialDeals,
}: {
  clients: Client[];
  initialDeals: Deal[];
}) {
  return (
    <ToastProvider>
      {initialDeals.length === 0 ? (
        <EmptyState
          icon="broom"
          title="The board is spotless"
          description="No deals yet. Add one from a client page and it’ll appear right here."
        />
      ) : (
        <PipelineBoardInner clients={clients} initialDeals={initialDeals} />
      )}
    </ToastProvider>
  );
}

export { PipelineBoard };

"use client";

import * as React from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Layers,
  Megaphone,
  Plus,
  Wallet,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  SectionHeading,
  Textarea,
} from "@/components/ui";
import { ToastProvider, useToast } from "@/components/agency-toast";
import { Icon, type IconName } from "@/components/icons";
import { cn, formatCurrency, formatDateRange } from "@/lib/utils";
import {
  CAMPAIGN_STATUSES,
  CHANNELS,
  CHANNEL_LABELS,
  type Campaign,
  type CampaignStatus,
  type Channel,
  type Client,
  type ContentItem,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Channel + status theming                                            */
/* ------------------------------------------------------------------ */

type Accent = "mint" | "peach" | "sky" | "butter" | "lilac";

const CHANNEL_ACCENT: Record<Channel, Accent> = {
  SOCIAL: "lilac",
  EMAIL: "sky",
  SEO: "mint",
  SEM: "peach",
  BLOG: "butter",
};

const CHANNEL_TINT: Record<Channel, string> = {
  SOCIAL: "bg-paper-2",
  EMAIL: "bg-paper-2",
  SEO: "bg-paper-2",
  SEM: "bg-paper-3",
  BLOG: "bg-paper-3",
};

const CHANNEL_BAR: Record<Channel, string> = {
  SOCIAL: "bg-paper-3",
  EMAIL: "bg-paper-2",
  SEO: "bg-paper-3",
  SEM: "bg-accent",
  BLOG: "bg-paper-3",
};

const CHANNEL_ICON: Record<Channel, string> = {
  SOCIAL: "campaign",
  EMAIL: "email",
  SEO: "search",
  SEM: "goal",
  BLOG: "document",
};

const STATUS_TONE: Record<CampaignStatus, "mint" | "butter" | "sky" | "neutral"> = {
  ACTIVE: "mint",
  DRAFT: "sky",
  PAUSED: "butter",
  COMPLETED: "neutral",
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
};

/* ------------------------------------------------------------------ */
/* Date helpers (local-time based)                                     */
/* ------------------------------------------------------------------ */

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

/* ------------------------------------------------------------------ */
/* Planner                                                             */
/* ------------------------------------------------------------------ */

interface CampaignDraft {
  name: string;
  clientId: string;
  channel: Channel;
  budget: string;
  brief: string;
  startDate: string;
  endDate: string;
}

const EMPTY_DRAFT: CampaignDraft = {
  name: "",
  clientId: "",
  channel: "SOCIAL",
  budget: "",
  brief: "",
  startDate: "",
  endDate: "",
};

function CampaignPlannerInner({
  campaigns: initialCampaigns,
  clients,
  content,
}: {
  campaigns: Campaign[];
  clients: Client[];
  content: ContentItem[];
}) {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [channelFilter, setChannelFilter] = React.useState<"ALL" | Channel>(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | CampaignStatus
  >("ALL");
  const [clientFilter, setClientFilter] = React.useState("all");
  const [view, setView] = React.useState<"calendar" | "cards">("calendar");
  const [cursor, setCursor] = React.useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<CampaignDraft>(EMPTY_DRAFT);

  const clientName = React.useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client",
    [clients],
  );

  const contentCountByCampaign = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of content) {
      if (!item.campaignId) continue;
      counts.set(item.campaignId, (counts.get(item.campaignId) ?? 0) + 1);
    }
    return counts;
  }, [content]);

  const filtered = React.useMemo(
    () =>
      campaigns.filter((c) => {
        if (channelFilter !== "ALL" && c.channel !== channelFilter) return false;
        if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
        if (clientFilter !== "all" && c.clientId !== clientFilter) return false;
        return true;
      }),
    [campaigns, channelFilter, statusFilter, clientFilter],
  );

  const totals = React.useMemo(() => {
    const budget = filtered.reduce((sum, c) => sum + (c.budgetCents ?? 0), 0);
    const active = filtered.filter((c) => c.status === "ACTIVE").length;
    return { budget, active, count: filtered.length };
  }, [filtered]);

  /* ---------------- calendar ---------------- */

  const monthGrid = React.useMemo(() => {
    const first = new Date(cursor);
    first.setDate(1);
    first.setHours(0, 0, 0, 0);
    const gridStart = addDays(first, -first.getDay()); // Sunday
    const weeks = 6;
    const days: Date[] = [];
    for (let i = 0; i < weeks * 7; i += 1) {
      days.push(addDays(gridStart, i));
    }
    return days;
  }, [cursor]);

  const today = React.useMemo(() => startOfDay(new Date()), []);

  const monthBounds = React.useMemo(() => {
    const start = new Date(cursor);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [cursor]);

  /** Campaigns that overlap the visible month, clipped to the month window. */
  const monthCampaigns = React.useMemo(() => {
    return filtered
      .filter((c) => {
        if (!c.startDate) return false;
        const start = new Date(c.startDate);
        const end = c.endDate ? new Date(c.endDate) : start;
        return start <= monthBounds.end && end >= monthBounds.start;
      })
      .map((c) => {
        const rawStart = c.startDate ? new Date(c.startDate) : monthBounds.start;
        const rawEnd = c.endDate ? new Date(c.endDate) : rawStart;
        const start = rawStart < monthBounds.start ? monthBounds.start : rawStart;
        const end = rawEnd > monthBounds.end ? monthBounds.end : rawEnd;
        const total = monthBounds.end.getTime() - monthBounds.start.getTime();
        const offset = Math.max(
          0,
          (start.getTime() - monthBounds.start.getTime()) / total,
        );
        const span = Math.max(
          0.012,
          Math.min(1, (end.getTime() - start.getTime()) / total),
        );
        return { campaign: c, offset, span };
      })
      .sort((a, b) => a.offset - b.offset);
  }, [filtered, monthBounds]);

  const shiftMonth = (delta: number) => {
    setCursor((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      next.setDate(1);
      next.setHours(0, 0, 0, 0);
      return next;
    });
  };

  /* ---------------- new campaign ---------------- */

  const submitCampaign = () => {
    if (!draft.name.trim()) {
      toast({
        title: "Give it a name first",
        description: "Give the campaign a name.",
        tone: "butter",
        icon: "content",
      });
      return;
    }
    const clientId = draft.clientId || clients[0]?.id || "";
    const budgetCents = draft.budget
      ? Math.round(parseFloat(draft.budget) * 100)
      : null;

    const created: Campaign = {
      id: `cmp_local_${Date.now().toString(36)}`,
      clientId,
      name: draft.name.trim(),
      channel: draft.channel,
      status: "DRAFT",
      startDate: draft.startDate ? new Date(draft.startDate) : null,
      endDate: draft.endDate ? new Date(draft.endDate) : null,
      budgetCents,
      brief: draft.brief.trim() || null,
      createdAt: new Date(),
    };

    setCampaigns((prev) => [created, ...prev]);
    setDialogOpen(false);
    setDraft(EMPTY_DRAFT);
    toast({
      title: "Campaign created",
      description: `${created.name} was added to the roster.`,
      tone: CHANNEL_ACCENT[created.channel],
      icon: "party",
    });
  };

  /* ---------------- render ---------------- */

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="campaign"
        title="Campaign planner"
        description="Plan the work, spot the overlaps, and keep every channel honest."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-control border border-rule bg-paper-2 p-1 shadow-card"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                onClick={() => setView("calendar")}
                aria-pressed={view === "calendar"}
                className={cn(
                  "rounded-control px-3 py-1.5 text-xs font-bold transition-colors",
                  view === "calendar"
                    ? "bg-paper-2 text-ink"
                    : "text-ink-2 hover:text-ink",
                )}
              >
                Calendar
              </button>
              <button
                type="button"
                onClick={() => setView("cards")}
                aria-pressed={view === "cards"}
                className={cn(
                  "rounded-control px-3 py-1.5 text-xs font-bold transition-colors",
                  view === "cards"
                    ? "bg-paper-2 text-ink"
                    : "text-ink-2 hover:text-ink",
                )}
              >
                Cards
              </button>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New campaign
            </Button>
          </div>
        }
      />

      {/* ---------------- filters ---------------- */}
      <Card className="animate-rise">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Label htmlFor="campaign-channel">Channel</Label>
            <select
              id="campaign-channel"
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as "ALL" | Channel)
              }
              className={selectClass}
            >
              <option value="ALL">All channels</option>
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>
                  {CHANNEL_LABELS[ch]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label htmlFor="campaign-status">Status</Label>
            <select
              id="campaign-status"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | CampaignStatus)
              }
              className={selectClass}
            >
              <option value="ALL">All statuses</option>
              {CAMPAIGN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <Label htmlFor="campaign-client">Client</Label>
            <select
              id="campaign-client"
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
          <div className="flex gap-4 lg:pb-1">
            <div>
              <p className="text-[11px] font-bold text-muted">
                Budget
              </p>
              <p className="font-display text-lg font-bold text-ink">
                {formatCurrency(totals.budget)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted">
                Active
              </p>
              <p className="font-display text-lg font-bold text-ink">
                {totals.active}
                <span className="text-sm font-bold text-muted">
                  /{totals.count}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---------------- body ---------------- */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No campaigns match those filters"
          description="Try widening the filters, or start something new, a blank calendar is a beautiful thing."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New campaign
            </Button>
          }
        />
      ) : view === "calendar" ? (
        <CalendarView
          campaigns={monthCampaigns}
          monthLabel={MONTH_LABEL.format(cursor)}
          monthGrid={monthGrid}
          today={today}
          cursorMonth={cursor.getMonth()}
          onShift={shiftMonth}
          contentCountByCampaign={contentCountByCampaign}
          clientName={clientName}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((campaign, i) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              clientName={clientName(campaign.clientId)}
              contentCount={contentCountByCampaign.get(campaign.id) ?? 0}
              index={i}
            />
          ))}
        </div>
      )}

      <NewCampaignDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        draft={draft}
        setDraft={setDraft}
        clients={clients}
        onSubmit={submitCampaign}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calendar view                                                       */
/* ------------------------------------------------------------------ */

function CalendarView({
  campaigns,
  monthLabel,
  monthGrid,
  today,
  cursorMonth,
  onShift,
  contentCountByCampaign,
  clientName,
}: {
  campaigns: { campaign: Campaign; offset: number; span: number }[];
  monthLabel: string;
  monthGrid: Date[];
  today: Date;
  cursorMonth: number;
  onShift: (delta: number) => void;
  contentCountByCampaign: Map<string, number>;
  clientName: (id: string) => string;
}) {
  return (
    <Card className="animate-rise overflow-hidden">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4 text-muted" aria-hidden />
          {monthLabel}
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onShift(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onShift(1)}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-rule bg-paper-3/60">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-[11px] font-bold text-muted"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div>
          {Array.from({ length: 6 }).map((_, weekIdx) => {
            const week = monthGrid.slice(weekIdx * 7, weekIdx * 7 + 7);
            return (
              <div
                key={weekIdx}
                className="grid grid-cols-7 border-b border-rule last:border-b-0"
              >
                {week.map((day) => {
                  const inMonth = day.getMonth() === cursorMonth;
                  const isToday = sameDay(day, today);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "relative min-h-[92px] border-r border-rule p-1.5 last:border-r-0",
                        inMonth ? "bg-paper-2" : "bg-paper-3/40",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold",
                          isToday
                            ? "bg-paper-3 text-ink"
                            : inMonth
                              ? "text-ink-2"
                              : "text-muted/60",
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Campaign bars, positioned over the grid as an overlay */}
        <div className="relative border-t border-rule bg-paper-3/30">
          <div className="flex items-center justify-between px-3 py-2">
            <p className="text-[11px] font-bold text-muted">
              Running this month
            </p>
            <p className="text-[11px] font-bold text-muted">
              {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="space-y-1.5 px-3 pb-4">
            {campaigns.map(({ campaign, offset, span }) => {
              const count = contentCountByCampaign.get(campaign.id) ?? 0;
              return (
                <div
                  key={campaign.id}
                  className="relative h-9 rounded-control bg-paper-3/60"
                >
                  <div
                    className={cn(
                      "absolute top-1 flex h-7 items-center gap-2 overflow-hidden rounded-control px-2.5 shadow-card transition-transform hover:z-10 hover:scale-[1.01]",
                      CHANNEL_TINT[campaign.channel],
                    )}
                    style={{
                      left: `${offset * 100}%`,
                      width: `${span * 100}%`,
                    }}
                  >
                    <span
                      className={cn(
                        "h-full w-1 shrink-0 rounded-full",
                        CHANNEL_BAR[campaign.channel],
                      )}
                      aria-hidden
                    />
                    <span className="truncate text-xs font-bold text-ink">
                      {campaign.name}
                    </span>
                    <span className="ml-auto hidden shrink-0 items-center gap-1.5 text-[10px] font-bold text-ink-2 sm:flex">
                      <span>{clientName(campaign.clientId)}</span>
                      {count > 0 && (
                        <span className="rounded-full bg-paper-2/80 px-1.5 py-0.5 text-muted">
                          {count} item{count === 1 ? "" : "s"}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Campaign card                                                       */
/* ------------------------------------------------------------------ */

function CampaignCard({
  campaign,
  clientName,
  contentCount,
  index,
}: {
  campaign: Campaign;
  clientName: string;
  contentCount: number;
  index: number;
}) {
  return (
    <Card
      className="animate-rise flex flex-col overflow-hidden transition-shadow hover:shadow-card"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <span
        className={cn("h-1.5 w-full", CHANNEL_BAR[campaign.channel])}
        aria-hidden
      />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{campaign.name}</CardTitle>
          <Badge tone={STATUS_TONE[campaign.status]}>
            {STATUS_LABEL[campaign.status]}
          </Badge>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone={CHANNEL_ACCENT[campaign.channel]}>
            <Icon name={CHANNEL_ICON[campaign.channel] as IconName} className="h-3.5 w-3.5" />
            {CHANNEL_LABELS[campaign.channel]}
          </Badge>
          <span className="text-xs font-bold text-ink-2">
            {clientName}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {campaign.brief && (
          <p className="text-sm leading-relaxed text-ink-2">
            {campaign.brief}
          </p>
        )}

        <dl className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 font-bold text-muted">
              <CalendarRange className="h-3 w-3" aria-hidden />
              Dates
            </dt>
            <dd className="text-right font-bold text-ink">
              {campaign.startDate && campaign.endDate
                ? formatDateRange(campaign.startDate, campaign.endDate)
                : campaign.startDate
                  ? formatDateRange(campaign.startDate, campaign.startDate)
                  : "Not scheduled"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 font-bold text-muted">
              <Wallet className="h-3 w-3" aria-hidden />
              Budget
            </dt>
            <dd className="font-bold text-ink">
              {campaign.budgetCents
                ? formatCurrency(campaign.budgetCents)
                : ","}
            </dd>
          </div>
        </dl>
      </CardContent>

      <div className="flex items-center justify-between gap-2 border-t border-rule px-5 py-3">
        <span className="flex items-center gap-1.5 text-xs font-bold text-ink-2">
          <Layers className="h-3.5 w-3.5 text-muted" aria-hidden />
          {contentCount} content item{contentCount === 1 ? "" : "s"}
        </span>
        <Link
          href="/content-studio"
          className="text-xs font-bold text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
        >
          Open Content Studio
        </Link>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* New campaign dialog                                                 */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-control border border-rule bg-paper-2 px-3.5 pr-9 text-sm text-ink transition-colors hover:border-rule focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

function NewCampaignDialog({
  open,
  onOpenChange,
  draft,
  setDraft,
  clients,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: CampaignDraft;
  setDraft: React.Dispatch<React.SetStateAction<CampaignDraft>>;
  clients: Client[];
  onSubmit: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-paper-3/95 " />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-rule bg-paper-2 p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-ink">
                New campaign
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-ink-2">
                Set the shape of it now, you can fill in the details later.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="nc-name">Campaign name</Label>
              <Input
                id="nc-name"
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                placeholder="Spring Bloom Launch"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nc-client">Client</Label>
                <select
                  id="nc-client"
                  value={draft.clientId}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, clientId: e.target.value }))
                  }
                  className={selectClass}
                >
                  <option value="">Pick a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="nc-channel">Channel</Label>
                <select
                  id="nc-channel"
                  value={draft.channel}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      channel: e.target.value as Channel,
                    }))
                  }
                  className={selectClass}
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>
                      {CHANNEL_LABELS[ch]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nc-start">Start date</Label>
                <Input
                  id="nc-start"
                  type="date"
                  value={draft.startDate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, startDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="nc-end">End date</Label>
                <Input
                  id="nc-end"
                  type="date"
                  value={draft.endDate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="nc-budget">Budget (USD)</Label>
              <Input
                id="nc-budget"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={draft.budget}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, budget: e.target.value }))
                }
                placeholder="2500"
              />
            </div>

            <div>
              <Label htmlFor="nc-brief">Brief</Label>
              <Textarea
                id="nc-brief"
                rows={4}
                value={draft.brief}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, brief: e.target.value }))
                }
                placeholder="What are we trying to do, and how will we know it worked?"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button onClick={onSubmit}>
              <Megaphone className="h-4 w-4" />
              Create campaign
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function CampaignPlanner(props: {
  campaigns: Campaign[];
  clients: Client[];
  content: ContentItem[];
}) {
  return (
    <ToastProvider>
      <CampaignPlannerInner {...props} />
    </ToastProvider>
  );
}

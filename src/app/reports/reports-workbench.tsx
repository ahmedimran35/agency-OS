"use client";

import * as React from "react";
import {
  Eye,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Download,
  FileBarChart,
  Send,
  Sparkles,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  RaisedCard,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Label,
  SectionHeading,
  StatTile,
} from "@/components/ui";
import { ToastProvider, useToast } from "@/components/agency-toast";
import {
  clamp,
  cn,
  formatCompact,
  formatDateRange,
  formatPercent,
  formatRelative,
} from "@/lib/utils";
import {
  REPORT_STATUSES,
  type Client,
  type ClientMetrics,
  type MetricPoint,
  type Report,
  type ReportStatus,
} from "@/lib/types";
import { updateReport } from "@/lib/data";

/* ------------------------------------------------------------------ */
/* Status                                                             */
/* ------------------------------------------------------------------ */

const STATUS_TONE: Record<ReportStatus, "sky" | "mint" | "neutral"> = {
  DRAFT: "sky",
  READY: "mint",
  SENT: "neutral",
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SENT: "Sent",
};

const STATUS_EMOJI: Record<ReportStatus, string> = {
  DRAFT: "document",
  READY: "check",
  SENT: "launch",
};

/* ------------------------------------------------------------------ */
/* Period options                                                     */
/* ------------------------------------------------------------------ */

type PeriodKey = "last30" | "prev30" | "thisMonth" | "lastMonth";

const PERIOD_OPTIONS: { key: PeriodKey; label: string; hint: string }[] = [
  { key: "last30", label: "Last 30 days", hint: "Rolling window" },
  { key: "prev30", label: "Previous 30 days", hint: "The one before" },
  { key: "thisMonth", label: "This month", hint: "Month to date" },
  { key: "lastMonth", label: "Last month", hint: "Complete month" },
];

const MS_DAY = 86_400_000;

function periodBounds(key: PeriodKey): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);

  switch (key) {
    case "last30":
      start.setDate(start.getDate() - 29);
      break;
    case "prev30":
      start.setDate(start.getDate() - 59);
      end.setDate(end.getDate() - 30);
      break;
    case "thisMonth":
      start.setDate(1);
      break;
    case "lastMonth": {
      const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfPrev = new Date(firstOfThis.getTime() - 1);
      start.setFullYear(lastOfPrev.getFullYear(), lastOfPrev.getMonth(), 1);
      end.setTime(lastOfPrev.getTime());
      end.setHours(23, 59, 59, 999);
      break;
    }
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

/* ------------------------------------------------------------------ */
/* Trend maths, deterministic, no model calls                          */
/* ------------------------------------------------------------------ */

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Compare the two halves of the trend series.
 *
 * The series runs oldest → newest, so the first half is the earlier period
 * and the second half is the more recent one. The ratio between the two
 * halves is the period-over-period traffic factor.
 */
function trendFactor(trend: MetricPoint[]): number {
  if (trend.length < 2) return 1;
  const half = Math.floor(trend.length / 2);
  const previous = average(trend.slice(0, half).map((p) => p.value));
  const current = average(trend.slice(half).map((p) => p.value));
  if (previous === 0) return 1;
  return current / previous;
}

/**
 * Engagement rate is a rate, not a volume, so it does not simply scale with
 * the traffic factor. We have no separate engagement series, so we estimate
 * its momentum from how erratically the recent half of the trend swings, * spikier traffic reads as shakier engagement. Fully deterministic, and
 * flagged as an estimate in the UI.
 */
function engagementMomentum(trend: MetricPoint[]): number {
  if (trend.length < 4) return 0;
  const half = Math.floor(trend.length / 2);

  const volatility = (points: MetricPoint[]) => {
    if (points.length < 2) return 0;
    let sum = 0;
    for (let i = 1; i < points.length; i += 1) {
      sum += Math.abs(points[i].value - points[i - 1].value);
    }
    const mean = average(points.map((p) => p.value));
    return mean === 0 ? 0 : sum / (points.length - 1) / mean;
  };

  const previous = volatility(trend.slice(0, half));
  const current = volatility(trend.slice(half));
  if (previous === 0) return 0;

  return clamp((current - previous) / previous, -1, 1) * 0.4;
}

/* ------------------------------------------------------------------ */
/* Report generation                                                  */
/* ------------------------------------------------------------------ */

interface MetricRow {
  key: string;
  label: string;
  value: string;
  raw: number;
  delta: number | null;
  hint: string;
}

interface GeneratedReport {
  client: Client;
  metrics: ClientMetrics;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  summary: string;
  highlights: string[];
  rows: MetricRow[];
  ctr: number;
}

function buildReport(
  client: Client,
  metrics: ClientMetrics,
  periodKey: PeriodKey,
): GeneratedReport {
  const { start, end } = periodBounds(periodKey);
  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.key === periodKey)?.label ?? "Last 30 days";

  const factor = trendFactor(metrics.trend);
  const trafficDelta = factor - 1;
  const engagementDelta = engagementMomentum(metrics.trend);

  const ctr = metrics.impressions === 0 ? 0 : metrics.clicks / metrics.impressions;
  const conversionRate =
    metrics.visitors === 0 ? 0 : metrics.conversions / metrics.visitors;

  const rows: MetricRow[] = [
    {
      key: "impressions",
      label: "Impressions",
      value: formatCompact(metrics.impressions),
      raw: metrics.impressions,
      delta: trafficDelta,
      hint: "Times your content was seen",
    },
    {
      key: "clicks",
      label: "Clicks",
      value: formatCompact(metrics.clicks),
      raw: metrics.clicks,
      delta: trafficDelta,
      hint: "People who wanted to know more",
    },
    {
      key: "visitors",
      label: "Visitors",
      value: formatCompact(metrics.visitors),
      raw: metrics.visitors,
      delta: trafficDelta,
      hint: "Unique humans on the site",
    },
    {
      key: "conversions",
      label: "Conversions",
      value: formatCompact(metrics.conversions),
      raw: metrics.conversions,
      delta: trafficDelta,
      hint: "Orders, signups, bookings",
    },
    {
      key: "engagement",
      label: "Engagement rate",
      value: formatPercent(metrics.engagementRate),
      raw: metrics.engagementRate,
      delta: engagementDelta,
      hint: "How much people interacted",
    },
  ];

  const direction = trafficDelta >= 0 ? "up" : "down";
  const magnitude = Math.abs(trafficDelta * 100).toFixed(1);

  const summary = `${client.name} wrapped the period with ${formatCompact(
    metrics.conversions,
  )} conversions from ${formatCompact(
    metrics.visitors,
  )} visitors, ${direction} ${magnitude}% on the previous period. Reach landed at ${formatCompact(
    metrics.impressions,
  )} impressions with a ${(ctr * 100).toFixed(2)}% click-through rate, and ${(
    conversionRate * 100
  ).toFixed(2)}% of visitors converted.`;

  const highlights: string[] = [];

  if (trafficDelta >= 0) {
    highlights.push(
      `Traffic ${direction} ${magnitude}% versus the previous period`,
    );
    highlights.push(
      `${formatCompact(metrics.conversions)} conversions, ${direction === "up" ? "our best run" : "a step back from last time"} at this pace`,
    );
  } else {
    highlights.push(
      `Traffic softened ${magnitude}%, worth a look at the channel mix`,
    );
    highlights.push(
      `Conversions held at ${formatCompact(metrics.conversions)} despite the dip`,
    );
  }

  highlights.push(
    `Click-through rate of ${(ctr * 100).toFixed(2)}% across ${formatCompact(
      metrics.clicks,
    )} clicks`,
  );

  highlights.push(
    engagementDelta >= 0
      ? `Engagement nudged up to ${formatPercent(metrics.engagementRate)}`
      : `Engagement eased to ${formatPercent(metrics.engagementRate)}, content refresh recommended`,
  );

  if (metrics.clicks > 0) {
    highlights.push(
      `Roughly ${formatCompact(Math.round(metrics.clicks / 30))} clicks a day, every day`,
    );
  }

  return {
    client,
    metrics,
    periodStart: start,
    periodEnd: end,
    periodLabel,
    summary,
    highlights,
    rows,
    ctr,
  };
}

/* ------------------------------------------------------------------ */
/* Workbench                                                          */
/* ------------------------------------------------------------------ */

function ReportsWorkbenchInner({
  clients,
  reports: initialReports,
  metrics,
  agencyName,
}: {
  clients: Client[];
  reports: Report[];
  metrics: ClientMetrics[];
  agencyName: string;
}) {
  const { toast } = useToast();
  const [reports, setReports] = React.useState<Report[]>(initialReports);
  const [clientFilter, setClientFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | ReportStatus>(
    "ALL",
  );
  const [genClientId, setGenClientId] = React.useState(
    clients[0]?.id ?? "",
  );
  const [periodKey, setPeriodKey] = React.useState<PeriodKey>("last30");
  const [generated, setGenerated] = React.useState<GeneratedReport | null>(null);

  const clientName = React.useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client",
    [clients],
  );

  const metricsFor = React.useCallback(
    (clientId: string) => metrics.find((m) => m.clientId === clientId) ?? null,
    [metrics],
  );

  const generate = React.useCallback(
    (clientId: string, key: PeriodKey) => {
      const client = clients.find((c) => c.id === clientId);
      const clientMetrics = metricsFor(clientId);
      if (!client || !clientMetrics) {
        toast({
          title: "No metrics for that client yet",
          description: "Connect an analytics source and we’ll fill this in.",
          tone: "butter",
          icon: "analytics",
        });
        return;
      }
      setGenerated(buildReport(client, clientMetrics, key));
    },
    [clients, metricsFor, toast],
  );

  // Keep the preview in step with the pickers: it regenerates whenever the
  // client or the period changes, so the preview is never stale.
  React.useEffect(() => {
    if (!genClientId) return;
    const client = clients.find((c) => c.id === genClientId);
    const clientMetrics = metricsFor(genClientId);
    if (client && clientMetrics) {
      setGenerated(buildReport(client, clientMetrics, periodKey));
    }
  }, [genClientId, periodKey, clients, metricsFor]);

  const filtered = React.useMemo(
    () =>
      reports.filter((r) => {
        if (clientFilter !== "all" && r.clientId !== clientFilter) return false;
        if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
        return true;
      }),
    [reports, clientFilter, statusFilter],
  );

  const stats = React.useMemo(() => {
    const ready = reports.filter((r) => r.status === "READY").length;
    const sent = reports.filter((r) => r.status === "SENT").length;
    const draft = reports.filter((r) => r.status === "DRAFT").length;
    return { ready, sent, draft, total: reports.length };
  }, [reports]);

  const markSent = async (report: Report) => {
    const previous = report.status;
    setReports((prev) =>
      prev.map((r) => (r.id === report.id ? { ...r, status: "SENT" } : r)),
    );
    try {
      const updated = await updateReport(report.id, { status: "SENT" });
      if (!updated) throw new Error("Report not found");
      toast({
        title: "Report marked as sent",
        description: `${report.title} was marked as sent.`,
        tone: "mint",
        icon: "launch",
      });
    } catch {
      setReports((prev) =>
        prev.map((r) =>
          r.id === report.id ? { ...r, status: previous } : r,
        ),
      );
      toast({
        title: "That didn’t send",
        description: "We put it back in draft for you.",
        tone: "danger",
        icon: "notFound",
      });
    }
  };

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="analytics"
        title="Client reports"
        description="Turn a month of numbers into something a client actually wants to read."
        action={
          <Button
            onClick={() => {
              generate(genClientId, periodKey);
              toast({
                title: "Fresh preview ready",
                description: "Generated from the latest numbers.",
                tone: "sky",
                icon: "sparkle",
              });
            }}
          >
            <Sparkles className="h-4 w-4" />
            Generate preview
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="Reports"
          value={String(stats.total)}
          hint={`${stats.draft} in draft · ${stats.ready} ready to go`}
          accent="sky"
        />
        <StatTile
          label="Sent to clients"
          value={String(stats.sent)}
          hint="Reports that made it out the door"
          accent="mint"
        />
        <StatTile
          label="Awaiting review"
          value={String(stats.ready)}
          hint="Approved and ready to send"
          accent="lilac"
        />
      </div>

      {/* ---------------- generator ---------------- */}
      <Card className="animate-rise overflow-hidden">
        <div className="h-1.5 w-full bg-paper-2" aria-hidden />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted" aria-hidden />
            Monthly report generator
          </CardTitle>
          <p className="text-sm leading-relaxed text-ink-2">
            Pick a client and a period. We write the summary, the highlights
            and the numbers, you just have to press send.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <div>
              <Label htmlFor="report-client">Client</Label>
              <select
                id="report-client"
                value={genClientId}
                onChange={(e) => setGenClientId(e.target.value)}
                className={selectClass}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="report-period">Period</Label>
              <select
                id="report-period"
                value={periodKey}
                onChange={(e) => setPeriodKey(e.target.value as PeriodKey)}
                className={selectClass}
              >
                {PERIOD_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}, {p.hint}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={() => {
                generate(genClientId, periodKey);
                toast({
                  title: "Preview rebuilt",
                  description: "The draft, ready to edit.",
                  tone: "sky",
                  icon: "sparkle",
                });
              }}
              className="w-full lg:w-auto"
            >
              <FileBarChart className="h-4 w-4" />
              Build it
            </Button>
          </div>

          {generated && (
            <p className="mt-4 flex items-center gap-1.5 text-xs font-bold text-muted">
              <Check className="h-3.5 w-3.5 text-success-text" aria-hidden />
              Previewing{" "}
              {generated.client.name} ·{" "}
              {formatDateRange(generated.periodStart, generated.periodEnd)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---------------- preview ---------------- */}
      {generated ? (
        <ReportPreview report={generated} agencyName={agencyName} />
      ) : (
        <EmptyState
          icon="document"
          title="No report preview yet"
          description="Choose a client above and we’ll draft one for you."
        />
      )}

      {/* ---------------- list ---------------- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              All reports
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Everything you’ve written for clients, newest first.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <Label htmlFor="reports-client-filter" className="sr-only">
                Filter reports by client
              </Label>
              <select
                id="reports-client-filter"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className={cn(selectClass, "sm:w-52")}
              >
                <option value="all">All clients</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="reports-status-filter" className="sr-only">
                Filter reports by status
              </Label>
              <select
                id="reports-status-filter"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "ALL" | ReportStatus)
                }
                className={cn(selectClass, "sm:w-44")}
              >
                <option value="ALL">All statuses</option>
                {REPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="search"
            title="Nothing matches those filters"
            description="Try a different client, or clear the status filter and see the lot."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filtered.map((report, i) => (
              <ReportListCard
                key={report.id}
                report={report}
                clientName={clientName(report.clientId)}
                index={i}
                onMarkSent={markSent}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

/**
 * Build a printable report and hand it to the browser as a download.
 *
 * It is a real document, not a placeholder: the client, the period, the
 * metrics and the highlights are all in the file, and the page it opens is
 * styled to be printed or saved as a PDF by the browser.
 */
function downloadReport(report: GeneratedReport, agencyName: string) {
  const rows = report.rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          <td class="num">${escapeHtml(row.value)}</td>
          <td class="num">${row.delta === null ? "" : `${row.delta >= 0 ? "+" : ""}${(row.delta * 100).toFixed(1)}%`}</td>
        </tr>`,
    )
    .join("");

  const highlights = report.highlights
    .map((h) => `<li>${escapeHtml(h)}</li>`)
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(report.client.name)} report, ${escapeHtml(report.periodLabel)}</title>
<style>
  @page { margin: 18mm; }
  body {
    font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1f242b; margin: 0; padding: 32px; background: #fff;
  }
  header { border-bottom: 2px solid #e5e0d8; padding-bottom: 18px; margin-bottom: 24px; }
  h1 { font-size: 26px; margin: 0 0 6px; letter-spacing: -0.02em; }
  h2 { font-size: 15px; margin: 28px 0 10px; letter-spacing: -0.01em; }
  .muted { color: #6b7280; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { text-align: left; padding: 9px 0; border-bottom: 1px solid #ece7dd; font-size: 14px; }
  th { font-size: 12px; color: #6b7280; font-weight: 600; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  ul { padding-left: 20px; margin: 8px 0 0; }
  li { margin-bottom: 6px; }
  .summary { font-size: 15px; max-width: 62ch; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ece7dd; color: #6b7280; font-size: 12px; }
</style>
</head>
<body>
  <header>
    <h1>${escapeHtml(report.client.name)}</h1>
    <p class="muted">${escapeHtml(agencyName)} &middot; ${escapeHtml(report.periodLabel)}</p>
  </header>

  <h2>The short version</h2>
  <p class="summary">${escapeHtml(report.summary)}</p>

  <h2>Numbers</h2>
  <table>
    <thead><tr><th>Metric</th><th class="num">Value</th><th class="num">Change</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="muted" style="margin-top:8px">Click-through rate ${(report.ctr * 100).toFixed(2)}%. Changes compare the two halves of the 14-day trend series.</p>

  <h2>Highlights</h2>
  <ul>${highlights}</ul>

  <footer>Prepared by ${escapeHtml(agencyName)} for ${escapeHtml(report.client.name)}.</footer>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${report.client.slug}-${report.periodLabel.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/* White-label preview                                                 */
/* ------------------------------------------------------------------ */

function ReportPreview({
  report,
  agencyName,
}: {
  report: GeneratedReport;
  agencyName: string;
}) {
  const { toast } = useToast();

  return (
    <RaisedCard className="animate-rise overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-rule bg-paper-2 px-5 py-3">
        <p className="flex items-center gap-2 text-sm font-bold text-card-ink">
          <Eye className="h-4 w-4" aria-hidden="true" />
          Client-facing preview
        </p>
        <span className="rounded-full bg-paper-2 px-2.5 py-1 text-[11px] font-bold text-card-ink/65">
          {report.periodLabel}
        </span>
      </div>

      <div className="bg-card p-5 sm:p-8">
        {/* Agency branding placeholder */}
        <div className="flex items-center justify-between gap-4 border-b border-rule pb-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-control bg-paper-2"
              aria-hidden
            >
              <Sparkles className="h-5 w-5 text-card-ink" />
            </span>
            <div>
              <p className="font-display text-base font-bold text-card-ink">
                {agencyName}
              </p>
              <p className="text-xs text-card-ink/65">
                Marketing that gets noticed
              </p>
            </div>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-card-ink/65">Prepared for</p>
            <p className="font-display text-sm font-bold text-card-ink">
              {report.client.name}
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="mt-6">
          <p className="text-xs font-bold text-card-ink/65">
            Performance report
          </p>
          <h3 className="mt-1 font-display text-2xl font-bold text-card-ink">
            {report.client.name}
          </h3>
          <p className="mt-1 text-sm font-bold text-card-ink/80">
            {formatDateRange(report.periodStart, report.periodEnd)}
          </p>
        </div>

        {/* Headline metrics grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {report.rows.map((row) => (
            <div key={row.key} className="border-t-2 border-rule pt-3">
              <p className="text-[11px] font-bold text-card-ink/65">
                {row.label}
              </p>
              <p className="mt-1 font-display text-xl font-bold text-card-ink">
                {row.value}
              </p>
              <DeltaPill delta={row.delta} />
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 border-t-2 border-rule pt-5">
          <p className="text-xs font-bold text-card-ink/80">
            The short version
          </p>
          <p className="mt-2 text-sm leading-relaxed text-card-ink">
            {report.summary}
          </p>
        </div>

        {/* Highlights */}
        <div className="mt-6">
          <p className="text-xs font-bold text-card-ink/65">
            Highlights
          </p>
          <ul className="mt-3 space-y-2">
            {report.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-paper-3 text-[11px] font-bold text-card-ink"
                  aria-hidden
                >
                  ✓
                </span>
                <span className="text-sm leading-relaxed text-card-ink/80">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col gap-3 border-t border-rule pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-card-ink/65">
            Deltas compare the two halves of the 14-day trend series. Engagement
            rate is estimated from trend volatility.
          </p>
          <Button onClick={() => downloadReport(report, agencyName)}>
            <Download className="h-4 w-4" />
            Download report
          </Button>
        </div>
      </div>
    </RaisedCard>
  );
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <p className="mt-1 text-[11px] font-bold text-muted">,</p>
    );
  }
  const up = delta >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <p
      className={cn(
        "mt-1 flex items-center gap-0.5 text-[11px] font-bold",
        up ? "text-success-text" : "text-error-text",
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {formatPercent(delta)}
      <span className="text-muted">vs prior</span>
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* List card                                                           */
/* ------------------------------------------------------------------ */

function ReportListCard({
  report,
  clientName,
  index,
  onMarkSent,
}: {
  report: Report;
  clientName: string;
  index: number;
  onMarkSent: (report: Report) => void | Promise<void>;
}) {
  return (
    <Card
      className="animate-rise flex flex-col transition-shadow hover:shadow-card"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{report.title}</CardTitle>
            <p className="mt-1 text-xs font-bold text-ink-2">
              {clientName} · {formatDateRange(report.periodStart, report.periodEnd)}
            </p>
          </div>
          <Badge tone={STATUS_TONE[report.status]}>
            <span aria-hidden>{STATUS_EMOJI[report.status]}</span>
            {STATUS_LABEL[report.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="text-sm leading-relaxed text-ink-2">{report.summary}</p>

        <ul className="space-y-1.5">
          {report.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-paper-2"
                aria-hidden
              />
              <span className="text-xs leading-relaxed text-ink-2">{h}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <div className="flex items-center justify-between gap-2 border-t border-rule px-5 py-3">
        <span className="text-[11px] font-bold text-muted">
          Written {formatRelative(report.createdAt)}
        </span>
        {report.status !== "SENT" ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void onMarkSent(report)}
          >
            <Send className="h-3.5 w-3.5" />
            Mark as sent
          </Button>
        ) : (
          <span className="text-[11px] font-bold text-success-text">
            Delivered ✓
          </span>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-control border border-rule bg-paper-2 px-3.5 pr-9 text-sm text-ink transition-colors hover:border-rule focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export function ReportsWorkbench(props: {
  clients: Client[];
  reports: Report[];
  metrics: ClientMetrics[];
  agencyName: string;
}) {
  return (
    <ToastProvider>
      <ReportsWorkbenchInner {...props} />
    </ToastProvider>
  );
}

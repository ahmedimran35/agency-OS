import { connection } from "next/server";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ArrowUpRight,
  ChartLine,
  Clock,
  Sparkles,
  Target,
} from "lucide-react";
import { getDashboardData, getRecentActivity } from "@/lib/data";
import {
  CLIENT_STATUS_LABELS,
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  type ClientStatus,
  type DealStage,
  type ReportStatus,
} from "@/lib/types";
import {
  formatCurrency,
  formatDateRange,
  formatRelative,
} from "@/lib/utils";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  HealthRing,
  Progress,
  SectionHeading,
  StatTile,
  Tile,
  type BadgeTone,
} from "@/components/ui";
import { Icon, type IconName } from "@/components/icons";
import { TrendChart, type TrendPoint } from "@/components/trend-chart";
import { clientStatusTone } from "@/components/client-card";

/**
 * The Command Center, Brightside's flagship screen.
 *
 * One page answers: how are we doing, what needs me, and who is happy today.
 */

/**
 * `cacheComponents` is enabled project-wide, which makes the current clock a
 * dynamic read. `connection()` opts the route into request-time rendering and
 * `instant = false` allows it to render without a Suspense boundary.
 */
export const instant = false;

const STATUS_TONES: Record<ClientStatus, BadgeTone> = {
  ACTIVE: "success",
  ONBOARDING: "sky",
  PAUSED: "butter",
  CHURNED: "danger",
};

const ATTENTION_TINTS: Record<string, string> = {
  mint: "bg-paper-2",
  peach: "bg-paper-3",
  sky: "bg-paper-2",
  butter: "bg-paper-3",
  lilac: "bg-paper-2",
};

const STAGE_BARS: Record<DealStage, string> = {
  LEAD: "bg-paper-3",
  QUALIFIED: "bg-accent-2-soft",
  PROPOSAL: "bg-accent-3",
  NEGOTIATION: "bg-accent",
  WON: "bg-accent-2",
  LOST: "bg-paper-3",
};

const REPORT_TONES: Record<ReportStatus, BadgeTone> = {
  DRAFT: "neutral",
  READY: "sky",
  SENT: "success",
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "Draft",
  READY: "Ready",
  SENT: "Sent",
};

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function subtitleFor(hour: number) {
  if (hour < 12) return "Fresh coffee, fresh numbers. Here's the shape of the day.";
  if (hour < 18) return "Afternoon slump defeated, here's what's moving.";
  return "Winding down. Here's the day in one glance.";
}

export default async function DashboardPage() {
  await connection();

  const data = await getDashboardData();
  const activity = await getRecentActivity(8);
  const now = new Date();
  const hour = now.getHours();

  const clientById = new Map(data.clients.map((c) => [c.id, c]));

  // Aggregate the per-client click trends into one agency-wide daily series.
  const aggregate = new Map<string, number>();
  for (const metric of data.metrics) {
    for (const point of metric.trend) {
      aggregate.set(point.date, (aggregate.get(point.date) ?? 0) + point.value);
    }
  }
  const trafficSeries: TrendPoint[] = [...aggregate.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([date, value]) => ({ date, value }));

  const openDeals = data.deals.filter(
    (d) => d.stage !== "WON" && d.stage !== "LOST",
  );
  const pipelineTotal = openDeals.reduce((sum, d) => sum + d.valueCents, 0);

  const stageGroups = DEAL_STAGES.filter(
    (s) => s !== "WON" && s !== "LOST",
  ).map((stage) => {
    const deals = openDeals.filter((d) => d.stage === stage);
    return {
      stage,
      count: deals.length,
      valueCents: deals.reduce((sum, d) => sum + d.valueCents, 0),
    };
  });

  const latestReports = [...data.reports]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);

  const attention = data.attention;

  return (
    <div className="space-y-8">
      {/* ---------- Greeting ---------- */}
      <header className="animate-rise rounded-card bg-paper-2 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-display font-extrabold text-ink">
              {greetingFor(hour)}, Imran
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">
              {subtitleFor(hour)}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-control bg-paper-3 px-4 py-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-control bg-accent">
              <CalendarDays className="h-5 w-5 text-accent-ink" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-muted">Today</p>
              <p className="font-display text-sm font-bold text-ink">
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Stat row ---------- */}
      <section aria-label="Agency totals">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="animate-rise" style={{ animationDelay: "60ms" }}>
            <StatTile
              label="Monthly recurring revenue"
              value={formatCurrency(data.totals.mrrCents)}
              numeric={data.totals.mrrCents / 100}
              formatNumber="currency"
              hint="Active retainers, billed monthly"
            />
          </div>
          <div className="animate-rise" style={{ animationDelay: "130ms" }}>
            <StatTile
              label="Active clients"
              value={`${data.totals.activeClients} of ${data.totals.clients}`}
              hint="Everyone currently on the roster"
              accent="sky"
            />
          </div>
          <div className="animate-rise" style={{ animationDelay: "200ms" }}>
            <StatTile
              label="Pipeline value"
              value={formatCurrency(data.totals.pipelineValueCents)}
              numeric={data.totals.pipelineValueCents / 100}
              formatNumber="currency"
              hint={`Across ${data.totals.openDeals} open ${
                data.totals.openDeals === 1 ? "deal" : "deals"
              }`}
              accent="peach"
            />
          </div>
          <div className="animate-rise" style={{ animationDelay: "270ms" }}>
            <StatTile
              label="Content in flight"
              value={`${data.totals.contentInFlight}`}
              hint="Drafts, reviews and scheduled posts"
              accent="butter"
            />
          </div>
        </div>
      </section>

      {/* ---------- Needs your attention ---------- */}
      <section aria-labelledby="attention-heading">
        <SectionHeading
          title="Needs your attention"
          description="The short list. Handle these and the rest can wait."
        />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {attention.map((item, i) => (
            <Tile
              key={item.id}
              className="animate-rise p-5"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-paper-3">
                  <Icon
                    name={(item.icon as IconName) ?? "attention"}
                    className="h-5 w-5 text-ink"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-title font-bold text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-2">
                    {item.detail}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-control text-sm font-bold text-ink underline-offset-4 transition-colors hover:text-ink-2 hover:underline"
                  >
                    Take a look
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </div>
              </div>
            </Tile>
          ))}
        </div>
      </section>

      {/* ---------- Client health + activity ---------- */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="animate-rise lg:col-span-2" style={{ animationDelay: "60ms" }}>
          <CardHeader>
            <CardTitle>Client health</CardTitle>
            <CardDescription>
              Every account, scored and sorted by how it&apos;s doing.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.clients.map((client, i) => (
              <Link
                key={client.id}
                href={`/clients/${client.slug}`}
                className="group flex animate-rise items-center gap-3 rounded-control px-2 py-2.5 transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:bg-paper-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                style={{ animationDelay: `${80 + i * 50}ms` }}
              >
                <Avatar name={client.name} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-sm font-bold text-ink">
                      {client.name}
                    </p>
                    <Badge tone={STATUS_TONES[client.status]}>
                      {CLIENT_STATUS_LABELS[client.status]}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {client.industry ?? "Industry TBD"}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-display text-sm font-bold text-ink">
                    {formatCurrency(client.retainerCents)}
                  </p>
                  <p className="text-[11px] text-muted">per month</p>
                </div>
                <HealthRing
                  score={client.healthScore}
                  size={44}
                  accent={client.color}
                />
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                  aria-hidden
                />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-rise" style={{ animationDelay: "120ms" }}>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>What moved in the last few days.</CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Nothing yet. The fun starts soon.
              </p>
            ) : (
              <ol className="relative flex flex-col gap-4 border-l border-rule pl-5">
                {activity.map((item, i) => (
                  <li
                    key={item.id}
                    className="animate-rise relative"
                    style={{ animationDelay: `${140 + i * 45}ms` }}
                  >
                    <span
                      className="absolute -left-[1.9rem] flex h-6 w-6 items-center justify-center rounded-full bg-paper-2 text-xs shadow-card ring-2 ring-line"
                      aria-hidden
                    >
                      <Icon name={(item.icon as IconName) ?? "attention"} className="h-5 w-5 text-ink" />
                    </span>
                    <p className="text-sm leading-snug font-bold text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      {item.clientName}
                      <span aria-hidden>·</span>
                      <Clock className="h-3 w-3" aria-hidden />
                      {item.when}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ---------- Traffic chart + pipeline ---------- */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="animate-rise">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartLine className="h-4 w-4 text-muted" aria-hidden />
              This week
            </CardTitle>
            <CardDescription>
              Aggregate clicks across every client, last 14 days. Hover for the
              daily number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              points={trafficSeries}
              accent="sky"
              height={210}
              label="Agency-wide clicks over the last 14 days"
              valueFormat="clicks"
            />
          </CardContent>
        </Card>

        <Card className="animate-rise" style={{ animationDelay: "80ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted" aria-hidden />
              Pipeline snapshot
            </CardTitle>
            <CardDescription>
              {openDeals.length} open{" "}
              {openDeals.length === 1 ? "deal" : "deals"} worth{" "}
              {formatCurrency(pipelineTotal)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineTotal > 0 ? (
              <>
                <div
                  className="flex h-3 w-full overflow-hidden rounded-full bg-paper-3"
                  role="img"
                  aria-label={`Pipeline split by stage: ${stageGroups
                    .map((g) => `${DEAL_STAGE_LABELS[g.stage]} ${formatCurrency(g.valueCents)}`)
                    .join(", ")}`}
                >
                  {stageGroups
                    .filter((g) => g.valueCents > 0)
                    .map((g) => (
                      <div
                        key={g.stage}
                        className={STAGE_BARS[g.stage]}
                        style={{
                          width: `${(g.valueCents / pipelineTotal) * 100}%`,
                        }}
                        title={`${DEAL_STAGE_LABELS[g.stage]}, ${formatCurrency(g.valueCents)}`}
                      />
                    ))}
                </div>

                <ul className="mt-5 flex flex-col gap-3">
                  {stageGroups.map((g) => (
                    <li key={g.stage}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 font-bold text-ink">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${STAGE_BARS[g.stage]}`}
                            aria-hidden
                          />
                          {DEAL_STAGE_LABELS[g.stage]}
                        </span>
                        <span className="text-ink-2">
                          {g.count} {g.count === 1 ? "deal" : "deals"} ·{" "}
                          <span className="font-bold text-ink">
                            {formatCurrency(g.valueCents)}
                          </span>
                        </span>
                      </div>
                      <Progress
                        value={
                          pipelineTotal > 0
                            ? (g.valueCents / pipelineTotal) * 100
                            : 0
                        }
                        className="mt-1.5"
                        accent={
                          g.stage === "LEAD"
                            ? "sky"
                            : g.stage === "QUALIFIED"
                              ? "lilac"
                              : g.stage === "PROPOSAL"
                                ? "butter"
                                : "peach"
                        }
                      />
                    </li>
                  ))}
                </ul>

                <Link
                  href="/pipeline"
                  className="group mt-5 inline-flex items-center gap-1.5 rounded-control text-sm font-bold text-ink underline-offset-4 transition-colors hover:text-ink-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Open the pipeline
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted">
                No open deals. Time to go find some.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ---------- Reports ---------- */}
      <section aria-labelledby="reports-heading">
        <SectionHeading
          icon="analytics"
          title="Latest reports"
          description="Recaps that are ready to send, drafts that need a nudge, and one that already went out."
          action={
            <Link
              href="/reports"
              className="group inline-flex items-center gap-1.5 rounded-control text-sm font-bold text-ink underline-offset-4 transition-colors hover:text-ink-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              All reports
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          }
        />

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {latestReports.map((report, i) => (
            <Card
              key={report.id}
              className="animate-rise transition-shadow duration-200 hover:shadow-card"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <Badge tone={REPORT_TONES[report.status]}>
                    {REPORT_STATUS_LABELS[report.status]}
                  </Badge>
                </div>
                <CardDescription>
                  {clientById.get(report.clientId)?.name ?? "Unknown client"} ·{" "}
                  {formatDateRange(report.periodStart, report.periodEnd)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm leading-relaxed text-ink-2">
                  {report.summary}
                </p>
              </CardContent>
              <div className="flex items-center justify-between gap-3 p-5 pt-0">
                <p className="text-xs text-muted">
                  Updated {formatRelative(report.createdAt)}
                </p>
                <Link
                  href="/reports"
                  className="inline-flex items-center gap-1 rounded-control text-xs font-bold text-ink underline-offset-4 transition-colors hover:text-ink-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  Open
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

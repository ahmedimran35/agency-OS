"use client";

import * as React from "react";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Mail,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Progress,
  StatTile,
  type BadgeTone,
} from "@/components/ui";
import { TrendChart } from "@/components/trend-chart";
import { Icon, type IconName } from "@/components/icons";

/**
 * The tabbed body of a client detail page.
 *
 * Everything is pre-formatted into plain strings on the server so this stays
 * a cheap, serialisable client boundary.
 */

export interface DetailTabData {
  metrics: {
    impressions: string;
    clicks: string;
    visitors: string;
    conversions: string;
    engagementRate: string;
  } | null;
  trend: { date: string; value: number }[];
  contacts: {
    id: string;
    name: string;
    email: string;
    role: string;
    isPrimary: boolean;
  }[];
  content: {
    id: string;
    title: string;
    channel: string;
    status: string;
    updated: string;
  }[];
  campaigns: {
    id: string;
    name: string;
    channel: string;
    status: string;
    period: string;
    budget: string;
  }[];
  reports: {
    id: string;
    title: string;
    period: string;
    status: string;
    highlights: string[];
  }[];
  deals: {
    id: string;
    title: string;
    stage: string;
    value: string;
    probability: number;
    close: string;
  }[];
}

const CHANNEL_TONES: Record<string, BadgeTone> = {
  SOCIAL: "lilac",
  EMAIL: "peach",
  SEO: "mint",
  SEM: "butter",
  BLOG: "sky",
};

const CONTENT_TONES: Record<string, BadgeTone> = {
  IDEA: "neutral",
  DRAFTING: "sky",
  DRAFT: "sky",
  IN_REVIEW: "butter",
  APPROVED: "mint",
  SCHEDULED: "lilac",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

const CAMPAIGN_TONES: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  PAUSED: "butter",
  COMPLETED: "sky",
};

const DEAL_TONES: Record<string, BadgeTone> = {
  LEAD: "sky",
  QUALIFIED: "lilac",
  PROPOSAL: "butter",
  NEGOTIATION: "peach",
  WON: "success",
  LOST: "danger",
};

const REPORT_TONES: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  READY: "sky",
  SENT: "success",
};

const TAB_LIST =
  "flex w-full gap-1 overflow-x-auto rounded-card border border-rule bg-paper-3/70 p-1.5";

function tabTriggerClass() {
  return cn(
    "shrink-0 rounded-control px-4 py-2 text-sm font-bold whitespace-nowrap transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
    "text-ink-2 hover:bg-paper-2/60 hover:text-ink",
    "data-[state=active]:bg-paper-2 data-[state=active]:text-ink data-[state=active]:shadow-card",
  );
}

export function ClientDetailTabs({ data }: { data: DetailTabData }) {
  return (
    <Tabs.Root defaultValue="overview" className="w-full">
      {/* The strip scrolls horizontally on narrow screens; the fade hints at it. */}
      <div className="relative">
        <Tabs.List className={TAB_LIST} aria-label="Client sections">
          <Tabs.Trigger value="overview" className={tabTriggerClass()}>
            Overview
          </Tabs.Trigger>
          <Tabs.Trigger value="content" className={tabTriggerClass()}>
            Content
          </Tabs.Trigger>
          <Tabs.Trigger value="campaigns" className={tabTriggerClass()}>
            Campaigns
          </Tabs.Trigger>
          <Tabs.Trigger value="reports" className={tabTriggerClass()}>
            Reports
          </Tabs.Trigger>
          <Tabs.Trigger value="deals" className={tabTriggerClass()}>
            Deals
          </Tabs.Trigger>
        </Tabs.List>
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-2xl bg-gradient-to-l from-paper-sunken to-transparent sm:hidden"
          aria-hidden
        />
      </div>

      {/* ---------- Overview ---------- */}
      <Tabs.Content value="overview" className="mt-5 focus-visible:outline-none">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {data.metrics ? (
              <>
                <StatTile
                  label="Impressions"
                  value={data.metrics.impressions}
                  accent="sky"
                />
                <StatTile
                  label="Clicks"
                  value={data.metrics.clicks}
                  accent="mint"
                />
                <StatTile
                  label="Visitors"
                  value={data.metrics.visitors}
                  accent="lilac"
                />
                <StatTile
                  label="Conversions"
                  value={data.metrics.conversions}
                  accent="peach"
                />
                <StatTile
                  label="Engagement rate"
                  value={data.metrics.engagementRate}
                  accent="butter"
                />
              </>
            ) : (
              <div className="sm:col-span-2 xl:col-span-5">
                <EmptyState
                  icon="signal"
                  title="No metrics wired up yet"
                  description="Connect an analytics source and this panel fills itself in. Until then, it’s a very handsome empty box."
                />
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Traffic trend</CardTitle>
              <CardDescription>
                Daily clicks over the last 14 days. Hover the chart for a
                specific day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TrendChart
                points={data.trend}
                accent="sky"
                height={230}
                label="Clicks over the last 14 days"
                valueFormat="clicks"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>
                The humans to email when something needs a decision.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.contacts.length === 0 ? (
                <p className="py-4 text-sm text-muted">
                  No contacts on file. Add one so escalations have somewhere to
                  go.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {data.contacts.map((contact) => (
                    <li
                      key={contact.id}
                      className="flex items-start gap-3 rounded-control border border-rule bg-paper-3/50 p-3"
                    >
                      <Avatar name={contact.name} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-ink">
                            {contact.name}
                          </p>
                          {contact.isPrimary && (
                            <Badge tone="mint">
                              <Star className="h-3 w-3" aria-hidden />
                              Primary
                            </Badge>
                          )}
                        </div>
                        <p className="truncate text-xs text-ink-2">
                          {contact.role}
                        </p>
                        <a
                          href={`mailto:${contact.email}`}
                          className="mt-1 inline-flex items-center gap-1.5 truncate text-xs font-bold text-ink underline-offset-4 transition-colors hover:text-ink-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        >
                          <Mail className="h-3 w-3 shrink-0" aria-hidden />
                          {contact.email}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs.Content>

      {/* ---------- Content ---------- */}
      <Tabs.Content value="content" className="mt-5 focus-visible:outline-none">
        {data.content.length === 0 ? (
          <EmptyState
            icon="content"
            title="No content yet"
            description="Nothing has been drafted for this client. The blank page is waiting for its masterpiece."
          />
        ) : (
          <div className="space-y-3">
            {data.content.map((item, i) => (
              <Card
                key={item.id}
                className="animate-rise transition-shadow duration-200 hover:shadow-card"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="flex flex-wrap items-center gap-3 pt-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-bold text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Updated {item.updated}
                    </p>
                  </div>
                  <Badge tone={CHANNEL_TONES[item.channel] ?? "neutral"}>
                    {item.channel}
                  </Badge>
                  <Badge tone={CONTENT_TONES[item.status] ?? "neutral"}>
                    {item.status}
                  </Badge>
                  <Link
                    href="/content-studio"
                    className="inline-flex items-center gap-1 rounded-control text-xs font-bold text-ink underline-offset-4 transition-colors hover:text-ink-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Open
                    <ArrowUpRight className="h-3 w-3" aria-hidden />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Tabs.Content>

      {/* ---------- Campaigns ---------- */}
      <Tabs.Content value="campaigns" className="mt-5 focus-visible:outline-none">
        {data.campaigns.length === 0 ? (
          <EmptyState
            icon="campaign"
            title="No campaigns running"
            description="Nothing in flight. A good time to pitch the next idea."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.campaigns.map((campaign, i) => (
              <Card
                key={campaign.id}
                className="animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{campaign.name}</CardTitle>
                    <Badge tone={CAMPAIGN_TONES[campaign.status] ?? "neutral"}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-2">
                    <Badge tone={CHANNEL_TONES[campaign.channel] ?? "neutral"}>
                      {campaign.channel}
                    </Badge>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                      {campaign.period}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="flex items-center gap-1.5 text-sm text-ink-2">
                    <CircleDollarSign className="h-4 w-4 text-muted" aria-hidden />
                    Budget{" "}
                    <span className="font-display font-bold text-ink">
                      {campaign.budget}
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Tabs.Content>

      {/* ---------- Reports ---------- */}
      <Tabs.Content value="reports" className="mt-5 focus-visible:outline-none">
        {data.reports.length === 0 ? (
          <EmptyState
            icon="analytics"
            title="No reports yet, let's make something people brag about."
            description="Once a month we pull the numbers together and turn them into a story worth sending."
          />
        ) : (
          <div className="space-y-4">
            {data.reports.map((report, i) => (
              <Card
                key={report.id}
                className="animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <Badge tone={REPORT_TONES[report.status] ?? "neutral"}>
                      {report.status}
                    </Badge>
                  </div>
                  <CardDescription>{report.period}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2">
                    {report.highlights.map((highlight, hi) => (
                      <li
                        key={hi}
                        className="flex items-start gap-2 text-sm leading-relaxed text-ink-2"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-paper-3"
                          aria-hidden
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Tabs.Content>

      {/* ---------- Deals ---------- */}
      <Tabs.Content value="deals" className="mt-5 focus-visible:outline-none">
        {data.deals.length === 0 ? (
          <EmptyState
            icon="deal"
            title="No deals on the table"
            description="Nothing open with this client right now. The pipeline is a clean slate."
          />
        ) : (
          <div className="space-y-3">
            {data.deals.map((deal, i) => (
              <Card
                key={deal.id}
                className="animate-rise"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-ink">
                        {deal.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        Expected close {deal.close}
                      </p>
                    </div>
                    <Badge tone={DEAL_TONES[deal.stage] ?? "neutral"}>
                      {deal.stage}
                    </Badge>
                    <p className="font-display text-base font-bold text-ink">
                      {deal.value}
                    </p>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-ink-2">
                        Likelihood
                      </span>
                      <span className="font-bold text-ink">
                        {Math.round(deal.probability * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={deal.probability * 100}
                      accent={
                        deal.stage === "WON"
                          ? "mint"
                          : deal.stage === "LOST"
                            ? "danger"
                            : "butter"
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}

import { connection } from "next/server";
import Link from "next/link";
import { ArrowLeft, Globe, SearchX, Wallet } from "lucide-react";
import { getClientBySlug } from "@/lib/data";
import { CLIENT_STATUS_LABELS } from "@/lib/types";
import {
  formatCompact,
  formatCurrency,
  formatDateRange,
  formatPercent,
  formatRelative,
} from "@/lib/utils";
import { Avatar, Badge, Button, HealthRing } from "@/components/ui";
import { ClientDetailTabs, type DetailTabData } from "./tabs";
import { clientStatusTone } from "@/components/client-card";

/**
 * A single client's world: who they are, how they’re doing, and everything
 * we’ve produced for them.
 */

export const instant = false;

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();

  const { slug } = await params;
  const client = await getClientBySlug(slug);

  if (!client) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <div className="animate-rise flex flex-col items-center gap-4 rounded-card border border-dashed border-rule bg-paper-3/50 px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-control bg-paper-2">
            <SearchX className="h-7 w-7 text-ink-2" aria-hidden="true" />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink">
            We couldn&apos;t find that client
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-ink-2">
            No client is filed under{" "}
            <span className="font-bold text-ink">/{slug}</span>. They may
            have been renamed, archived, or they may have never existed, which
            is also fine.
          </p>
          <Link href="/clients">
            <Button variant="mint">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to the roster
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const metrics = client.metrics;

  const tabData: DetailTabData = {
    metrics: metrics
      ? {
          impressions: formatCompact(metrics.impressions),
          clicks: formatCompact(metrics.clicks),
          visitors: formatCompact(metrics.visitors),
          conversions: formatCompact(metrics.conversions),
          engagementRate: formatPercent(metrics.engagementRate, 1),
        }
      : null,
    trend: metrics ? metrics.trend.map((p) => ({ ...p })) : [],
    contacts: client.contactList.map((contact) => ({
      id: contact.id,
      name: contact.name,
      email: contact.email,
      role: contact.role ?? "Contact",
      isPrimary: contact.isPrimary,
    })),
    content: client.contentList.map((item) => ({
      id: item.id,
      title: item.title,
      channel: item.channel,
      status: item.status,
      updated: formatRelative(item.updatedAt),
    })),
    campaigns: client.campaignList.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      channel: campaign.channel,
      status: campaign.status,
      period:
        campaign.startDate && campaign.endDate
          ? formatDateRange(campaign.startDate, campaign.endDate)
          : "No dates set",
      budget:
        campaign.budgetCents != null
          ? formatCurrency(campaign.budgetCents)
          : "No budget set",
    })),
    reports: client.reportList.map((report) => ({
      id: report.id,
      title: report.title,
      period: formatDateRange(report.periodStart, report.periodEnd),
      status: report.status,
      highlights: report.highlights,
    })),
    deals: client.dealList.map((deal) => ({
      id: deal.id,
      title: deal.title,
      stage: deal.stage,
      value: formatCurrency(deal.valueCents),
      probability: deal.probability,
      close: deal.expectedClose
        ? formatDateRange(deal.expectedClose, deal.expectedClose)
        : "TBC",
    })),
  };

  return (
    <div className="space-y-8">
      {/* ---------- Header ---------- */}
      <header className="animate-rise relative overflow-hidden rounded-card border border-rule bg-paper-2 p-6 shadow-card sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--sky) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative">
          <Link
            href="/clients"
            className="group inline-flex items-center gap-1.5 rounded-control text-xs font-bold text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
              aria-hidden
            />
            All clients
          </Link>

          <div className="mt-4 flex flex-wrap items-start gap-6">
            <Avatar name={client.name} size="xl" />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-extrabold text-ink">
                  {client.name}
                </h1>
                <Badge tone={clientStatusTone(client.status)}>
                  {CLIENT_STATUS_LABELS[client.status]}
                </Badge>
              </div>

              <p className="mt-1.5 text-sm text-ink-2">
                {client.industry ?? "Industry TBD"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
                {client.website && (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-control font-bold text-ink underline-offset-4 transition-colors hover:text-ink-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <Globe className="h-3.5 w-3.5" aria-hidden />
                    {client.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5" aria-hidden />
                  {formatCurrency(client.retainerCents)} retainer
                </span>
                <span>
                  Client since{" "}
                  {client.createdAt.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 bg-paper-3/60 px-5 py-4">
              <HealthRing
                score={client.healthScore}
                size={92}
                accent={client.color}
              />
              <p className="text-[11px] font-bold text-muted">
                Health
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- Tabs ---------- */}
      <ClientDetailTabs data={tabData} />
    </div>
  );
}

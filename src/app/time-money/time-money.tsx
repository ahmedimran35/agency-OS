"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  TrendingUp,
} from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Progress,
  SectionHeading,
  StatTile,
} from "@/components/ui";
import { ToastProvider, useToast } from "@/components/agency-toast";
import { cn, formatCurrency, formatDateRange } from "@/lib/utils";
import type { Client } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Mock money data                                                     */
/* ------------------------------------------------------------------ */

interface Retainer {
  clientId: string;
  /** Monthly fee in cents. */
  monthlyCents: number;
  /** Hours included in the retainer. */
  hoursIncluded: number;
  /** Hours actually tracked this period. */
  hoursUsed: number;
  /** Extra hourly rate in cents, applied past the included hours. */
  overageRateCents: number;
}

const RETAINERS: Retainer[] = [
  {
    clientId: "cli_bee",
    monthlyCents: 240000,
    hoursIncluded: 40,
    hoursUsed: 46,
    overageRateCents: 12000,
  },
  {
    clientId: "cli_north",
    monthlyCents: 180000,
    hoursIncluded: 32,
    hoursUsed: 28,
    overageRateCents: 11000,
  },
  {
    clientId: "cli_lumen",
    monthlyCents: 320000,
    hoursIncluded: 48,
    hoursUsed: 44,
    overageRateCents: 13000,
  },
  {
    clientId: "cli_fjord",
    monthlyCents: 150000,
    hoursIncluded: 24,
    hoursUsed: 31,
    overageRateCents: 9500,
  },
  {
    clientId: "cli_paper",
    monthlyCents: 90000,
    hoursIncluded: 16,
    hoursUsed: 11,
    overageRateCents: 9000,
  },
];

interface HourEntry {
  id: string;
  /** Days ago. */
  daysAgo: number;
  clientId: string;
  task: string;
  hours: number;
  billable: boolean;
}

const HOURS: HourEntry[] = [
  { id: "hr_1", daysAgo: 0, clientId: "cli_bee", task: "Launch carousel design", hours: 3.5, billable: true },
  { id: "hr_2", daysAgo: 0, clientId: "cli_north", task: "Gift guide email #3 copy", hours: 2, billable: true },
  { id: "hr_3", daysAgo: 1, clientId: "cli_lumen", task: "Keyword map cleanup", hours: 1.5, billable: true },
  { id: "hr_4", daysAgo: 1, clientId: "cli_bee", task: "Ingredient claim research", hours: 2.5, billable: true },
  { id: "hr_5", daysAgo: 2, clientId: "cli_fjord", task: "Class schedule assets", hours: 4, billable: true },
  { id: "hr_6", daysAgo: 2, clientId: "cli_paper", task: "Author platform discovery call", hours: 1, billable: false },
  { id: "hr_7", daysAgo: 3, clientId: "cli_north", task: "Email template build", hours: 3, billable: true },
  { id: "hr_8", daysAgo: 3, clientId: "cli_lumen", task: "Portfolio page draft", hours: 5, billable: true },
  { id: "hr_9", daysAgo: 4, clientId: "cli_bee", task: "Social variants for TikTok", hours: 2, billable: true },
  { id: "hr_10", daysAgo: 5, clientId: "cli_fjord", task: "Membership landing page QA", hours: 1.5, billable: true },
  { id: "hr_11", daysAgo: 5, clientId: "cli_paper", task: "Archive migration planning", hours: 2, billable: false },
  { id: "hr_12", daysAgo: 6, clientId: "cli_north", task: "Holiday blend landing page", hours: 3.5, billable: true },
];

type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE";

interface Invoice {
  id: string;
  number: string;
  clientId: string;
  periodStart: Date;
  periodEnd: Date;
  amountCents: number;
  status: InvoiceStatus;
  /** Days from now the invoice is due. Negative = overdue. */
  dueInDays: number;
}

function dateFromNow(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

const INVOICES: Invoice[] = [
  {
    id: "inv_1",
    number: "INV-2041",
    clientId: "cli_lumen",
    periodStart: dateFromNow(-30),
    periodEnd: dateFromNow(-1),
    amountCents: 320000,
    status: "SENT",
    dueInDays: 12,
  },
  {
    id: "inv_2",
    number: "INV-2039",
    clientId: "cli_bee",
    periodStart: dateFromNow(-30),
    periodEnd: dateFromNow(-1),
    amountCents: 240000,
    status: "OVERDUE",
    dueInDays: -4,
  },
  {
    id: "inv_3",
    number: "INV-2036",
    clientId: "cli_fjord",
    periodStart: dateFromNow(-60),
    periodEnd: dateFromNow(-31),
    amountCents: 150000,
    status: "PAID",
    dueInDays: -18,
  },
  {
    id: "inv_4",
    number: "INV-2034",
    clientId: "cli_north",
    periodStart: dateFromNow(-60),
    periodEnd: dateFromNow(-31),
    amountCents: 180000,
    status: "PAID",
    dueInDays: -20,
  },
  {
    id: "inv_5",
    number: "INV-2043",
    clientId: "cli_paper",
    periodStart: dateFromNow(-15),
    periodEnd: dateFromNow(14),
    amountCents: 90000,
    status: "DRAFT",
    dueInDays: 22,
  },
  {
    id: "inv_6",
    number: "INV-2040",
    clientId: "cli_fjord",
    periodStart: dateFromNow(-30),
    periodEnd: dateFromNow(-1),
    amountCents: 178500,
    status: "SENT",
    dueInDays: 9,
  },
];

const INVOICE_TONE: Record<
  InvoiceStatus,
  "neutral" | "sky" | "mint" | "peach"
> = {
  DRAFT: "neutral",
  SENT: "sky",
  PAID: "mint",
  OVERDUE: "peach",
};

const INVOICE_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

function TimeMoneyInner({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const [billableOnly, setBillableOnly] = React.useState(false);

  const clientName = React.useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client",
    [clients],
  );

  const retainerRows = React.useMemo(() => {
    return RETAINERS.map((r) => {
      const client = clients.find((c) => c.id === r.clientId);
      const overageHours = Math.max(0, r.hoursUsed - r.hoursIncluded);
      const overageCents = Math.round(overageHours * r.overageRateCents);
      const usagePct = (r.hoursUsed / r.hoursIncluded) * 100;
      return {
        ...r,
        client,
        overageHours,
        overageCents,
        usagePct,
        over: overageHours > 0,
      };
    }).filter((r) => r.client);
  }, [clients]);

  const visibleHours = React.useMemo(
    () => (billableOnly ? HOURS.filter((h) => h.billable) : HOURS),
    [billableOnly],
  );

  const totals = React.useMemo(() => {
    const mrr = retainerRows.reduce((sum, r) => sum + r.monthlyCents, 0);
    const outstanding = INVOICES.filter(
      (i) => i.status === "SENT" || i.status === "OVERDUE",
    ).reduce((sum, i) => sum + i.amountCents, 0);
    const overdue = INVOICES.filter((i) => i.status === "OVERDUE").reduce(
      (sum, i) => sum + i.amountCents,
      0,
    );
    const totalHours = HOURS.reduce((sum, h) => sum + h.hours, 0);
    const billableHours = HOURS.filter((h) => h.billable).reduce(
      (sum, h) => sum + h.hours,
      0,
    );
    const includedHours = retainerRows.reduce(
      (sum, r) => sum + r.hoursIncluded,
      0,
    );
    const utilization = includedHours === 0 ? 0 : billableHours / includedHours;
    return {
      mrr,
      outstanding,
      overdue,
      totalHours,
      billableHours,
      includedHours,
      utilization,
    };
  }, [retainerRows]);

  const overdueInvoices = INVOICES.filter((i) => i.status === "OVERDUE");

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="wallet"
        title="Time & money"
        description="Retainers, hours, and invoices, the boring bits, made legible."
      />

      {/* ---------------- profit snapshot ---------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="MRR"
          value={formatCurrency(totals.mrr)}
          hint={`${retainerRows.length} active retainers`}
          accent="mint"
        />
        <StatTile
          label="Outstanding"
          value={formatCurrency(totals.outstanding)}
          hint={
            totals.overdue > 0
              ? `${formatCurrency(totals.overdue)} overdue, worth a nudge`
              : "Nothing overdue. Suspiciously polite."
          }
          accent={totals.overdue > 0 ? "peach" : "sky"}
        />
        <StatTile
          label="Utilization"
          value={`${Math.round(totals.utilization * 100)}%`}
          hint={`${totals.billableHours}h billable of ${totals.includedHours}h included`}
          accent="lilac"
        />
        <StatTile
          label="Hours this period"
          value={`${totals.totalHours}h`}
          hint={`${totals.billableHours}h billable · ${(totals.totalHours - totals.billableHours).toFixed(1)}h internal`}
          accent="butter"
        />
      </div>

      {overdueInvoices.length > 0 && (
        <Card className="animate-rise border-danger/40 bg-paper-3/60">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-control bg-paper-2 text-danger"
              aria-hidden
            >
              <AlertTriangle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-ink">
                {overdueInvoices.length} invoice
                {overdueInvoices.length === 1 ? " is" : "s are"} past due
              </p>
              <p className="text-xs text-ink-2">
                {overdueInvoices
                  .map((i) => `${i.number} (${clientName(i.clientId)})`)
                  .join(", ")}{" "}, {formatCurrency(totals.overdue)} outstanding.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                toast({
                  title: "Reminders queued",
                  description:
                    "We'll send a friendly nudge to each account contact at 9am tomorrow.",
                  tone: "peach",
                  icon: "email",
                })
              }
              className="rounded-control bg-paper-2 px-3 py-2 text-xs font-bold text-ink shadow-card transition-colors hover:bg-paper-3"
            >
              Send reminders
            </button>
          </CardContent>
        </Card>
      )}

      {/* ---------------- retainers ---------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Retainers
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            Where each client sits against the hours they’ve bought.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {retainerRows.map((row, i) => {
            const pct = Math.min(100, row.usagePct);
            return (
              <Card
                key={row.clientId}
                className="animate-rise transition-shadow hover:shadow-card"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {row.client?.name}
                      </CardTitle>
                      <p className="mt-1 text-xs font-bold text-muted">
                        {row.client?.industry}
                      </p>
                    </div>
                    <p className="font-display text-xl font-bold text-ink">
                      {formatCurrency(row.monthlyCents)}
                      <span className="text-xs font-bold text-muted">
                        /mo
                      </span>
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                      <span className="text-ink-2">
                        {row.hoursUsed}h used of {row.hoursIncluded}h included
                      </span>
                      <span
                        className={cn(
                          row.over ? "text-danger" : "text-muted",
                        )}
                      >
                        {Math.round(row.usagePct)}%
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      accent={row.over ? "danger" : "mint"}
                    />
                  </div>

                  {row.over ? (
                    <div className="flex items-center gap-2 rounded-control bg-paper-3 px-3 py-2">
                      <ArrowUpRight
                        className="h-3.5 w-3.5 shrink-0 text-danger"
                        aria-hidden
                      />
                      <p className="text-xs font-bold text-ink">
                        {row.overageHours}h over ,{" "}
                        {formatCurrency(row.overageCents)} to bill
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-control bg-paper-2 px-3 py-2">
                      <TrendingUp
                        className="h-3.5 w-3.5 shrink-0 text-success-text"
                        aria-hidden
                      />
                      <p className="text-xs font-bold text-ink">
                        {row.hoursIncluded - row.hoursUsed}h of breathing room
                        left
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ---------------- hours log ---------------- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">
              Hours log
            </h2>
            <p className="mt-1 text-sm text-ink-2">
              Every hour, accounted for. Toggle billable to see what counts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBillableOnly((v) => !v)}
            aria-pressed={billableOnly}
            className={cn(
              "rounded-control border px-3.5 py-2 text-xs font-bold transition-colors",
              billableOnly
                ? "border-accent bg-paper-2 text-ink"
                : "border-rule bg-paper-2 text-ink-2 hover:border-rule hover:text-ink",
            )}
          >
            {billableOnly ? "✓ " : ""}Billable only
          </button>
        </div>

        <Card className="animate-rise overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <caption className="sr-only">
                Logged hours by date, client, task, duration and billable status
              </caption>
              <thead>
                <tr className="border-b border-rule bg-paper-3/60">
                  <th scope="col" className="px-5 py-3 text-xs font-bold text-muted">
                    Date
                  </th>
                  <th scope="col" className="px-5 py-3 text-xs font-bold text-muted">
                    Client
                  </th>
                  <th scope="col" className="px-5 py-3 text-xs font-bold text-muted">
                    Task
                  </th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-muted">
                    Hours
                  </th>
                  <th scope="col" className="px-5 py-3 text-right text-xs font-bold text-muted">
                    Billable
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleHours.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-rule last:border-b-0 transition-colors hover:bg-paper-3/40"
                  >
                    <td className="px-5 py-3 text-xs font-bold whitespace-nowrap text-ink-2">
                      {dateFromNow(-entry.daysAgo).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold whitespace-nowrap text-ink">
                      {clientName(entry.clientId)}
                    </td>
                    <td className="px-5 py-3 text-sm text-ink-2">
                      {entry.task}
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-ink tabular-nums">
                      {entry.hours}h
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Badge tone={entry.billable ? "mint" : "neutral"}>
                        {entry.billable ? "Billable" : "Internal"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* ---------------- invoices ---------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">
            Invoices
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            Out the door and into the bank.
          </p>
        </div>

        {INVOICES.length === 0 ? (
          <EmptyState
            icon="receipt"
            title="No invoices yet"
            description="Send an invoice and it will show up here, nicely behaved."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {INVOICES.map((invoice, i) => (
              <Card
                key={invoice.id}
                className="animate-rise transition-shadow hover:shadow-card"
                style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-control bg-paper-2 text-ink-2"
                        aria-hidden
                      >
                        <Receipt className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="font-display text-sm font-bold text-ink">
                          {invoice.number}
                        </p>
                        <p className="text-xs font-bold text-ink-2">
                          {clientName(invoice.clientId)}
                        </p>
                      </div>
                    </div>
                    <Badge tone={INVOICE_TONE[invoice.status]}>
                      {INVOICE_LABEL[invoice.status]}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold text-muted">
                        {formatDateRange(invoice.periodStart, invoice.periodEnd)}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs font-bold",
                          invoice.status === "OVERDUE"
                            ? "text-danger"
                            : "text-muted",
                        )}
                      >
                        {invoice.status === "PAID"
                          ? "Paid, thank you"
                          : invoice.dueInDays < 0
                            ? `${Math.abs(invoice.dueInDays)} days overdue`
                            : `Due in ${invoice.dueInDays} days`}
                      </p>
                    </div>
                    <p className="font-display text-2xl font-bold text-ink">
                      {formatCurrency(invoice.amountCents)}
                    </p>
                  </div>
                </CardContent>
              </Card>
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

export function TimeMoney({ clients }: { clients: Client[] }) {
  return (
    <ToastProvider>
      <TimeMoneyInner clients={clients} />
    </ToastProvider>
  );
}

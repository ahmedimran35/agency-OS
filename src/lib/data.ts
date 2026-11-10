import type {
  Campaign,
  Client,
  ClientMetrics,
  Contact,
  ContentItem,
  Deal,
  Report,
} from "@/lib/types";
import { formatRelative } from "@/lib/utils";

/**
 * Data access contract for Agency OS.
 *
 * Every page and API route reads through these functions. The implementation
 * currently returns realistic mock data so the whole app is explorable with
 * zero setup; swapping in Prisma later means replacing the bodies below
 * without touching any caller.
 *
 * All functions are async and tenant-scoped.
 */

export interface DashboardData {
  agencyName: string;
  totals: {
    clients: number;
    activeClients: number;
    openDeals: number;
    pipelineValueCents: number;
    contentInFlight: number;
    mrrCents: number;
  };
  clients: Client[];
  deals: Deal[];
  recentContent: ContentItem[];
  metrics: ClientMetrics[];
  reports: Report[];
  /** Things needing attention today. */
  attention: {
    id: string;
    icon: string;
    title: string;
    detail: string;
    href: string;
    tone: "mint" | "peach" | "sky" | "butter" | "lilac";
  }[];
}

export interface ClientDetail extends Client {
  contactList: Contact[];
  dealList: Deal[];
  campaignList: Campaign[];
  contentList: ContentItem[];
  metrics: ClientMetrics | null;
  reportList: Report[];
}

export interface ContentFilters {
  clientId?: string;
  status?: string;
  channel?: string;
  limit?: number;
}

// ---------- Mock dataset ----------

const now = Date.now();
const day = 86_400_000;

const MOCK_CLIENTS: Client[] = [
  {
    id: "cli_bee",
    agencyId: "agy_demo",
    name: "Bee & Bloom",
    slug: "bee-and-bloom",
    industry: "Sustainable skincare",
    website: "https://beeandbloom.example",
    status: "ACTIVE",
    healthScore: 92,
    retainerCents: 240000,
    color: "mint",
    avatarUrl: null,
    contactIds: ["con_bee_1"],
    createdAt: new Date(now - 400 * day),
  },
  {
    id: "cli_north",
    agencyId: "agy_demo",
    name: "Northwind Roasters",
    slug: "northwind-roasters",
    industry: "Specialty coffee",
    website: "https://northwind.example",
    status: "ACTIVE",
    healthScore: 78,
    retainerCents: 180000,
    color: "peach",
    avatarUrl: null,
    contactIds: ["con_north_1"],
    createdAt: new Date(now - 260 * day),
  },
  {
    id: "cli_lumen",
    agencyId: "agy_demo",
    name: "Lumen Studio",
    slug: "lumen-studio",
    industry: "Architecture & interiors",
    website: "https://lumenstudio.example",
    status: "ONBOARDING",
    healthScore: 64,
    retainerCents: 320000,
    color: "sky",
    avatarUrl: null,
    contactIds: ["con_lumen_1"],
    createdAt: new Date(now - 12 * day),
  },
  {
    id: "cli_fjord",
    agencyId: "agy_demo",
    name: "Fjord Fitness",
    slug: "fjord-fitness",
    industry: "Boutique gym",
    website: "https://fjordfitness.example",
    status: "ACTIVE",
    healthScore: 85,
    retainerCents: 150000,
    color: "lilac",
    avatarUrl: null,
    contactIds: ["con_fjord_1"],
    createdAt: new Date(now - 520 * day),
  },
  {
    id: "cli_paper",
    agencyId: "agy_demo",
    name: "Paper Crane Press",
    slug: "paper-crane-press",
    industry: "Independent publisher",
    website: "https://papercrane.example",
    status: "PAUSED",
    healthScore: 41,
    retainerCents: 90000,
    color: "butter",
    avatarUrl: null,
    contactIds: ["con_paper_1"],
    createdAt: new Date(now - 700 * day),
  },
];

const MOCK_CONTACTS: Contact[] = [
  { id: "con_bee_1", clientId: "cli_bee", name: "Maya Okonkwo", email: "maya@beeandbloom.example", role: "Founder", isPrimary: true },
  { id: "con_north_1", clientId: "cli_north", name: "Tobias Rune", email: "tobias@northwind.example", role: "Owner", isPrimary: true },
  { id: "con_lumen_1", clientId: "cli_lumen", name: "Priya Raman", email: "priya@lumenstudio.example", role: "Director", isPrimary: true },
  { id: "con_fjord_1", clientId: "cli_fjord", name: "Sven Aas", email: "sven@fjordfitness.example", role: "Manager", isPrimary: true },
  { id: "con_paper_1", clientId: "cli_paper", name: "Ines Duarte", email: "ines@papercrane.example", role: "Publisher", isPrimary: true },
];

const MOCK_DEALS: Deal[] = [
  { id: "deal_1", clientId: "cli_lumen", title: "Brand launch campaign — Q4", stage: "PROPOSAL", valueCents: 850000, probability: 0.6, expectedClose: new Date(now + 21 * day), createdAt: new Date(now - 9 * day) },
  { id: "deal_2", clientId: "cli_north", title: "Holiday gift guide retainer", stage: "NEGOTIATION", valueCents: 420000, probability: 0.75, expectedClose: new Date(now + 7 * day), createdAt: new Date(now - 18 * day) },
  { id: "deal_3", clientId: "cli_bee", title: "Spring product launch", stage: "WON", valueCents: 610000, probability: 1, expectedClose: new Date(now - 30 * day), createdAt: new Date(now - 60 * day) },
  { id: "deal_4", clientId: "cli_fjord", title: "Membership growth push", stage: "QUALIFIED", valueCents: 280000, probability: 0.4, expectedClose: new Date(now + 35 * day), createdAt: new Date(now - 5 * day) },
  { id: "deal_5", clientId: "cli_paper", title: "Author platform rebuild", stage: "LEAD", valueCents: 190000, probability: 0.2, expectedClose: new Date(now + 50 * day), createdAt: new Date(now - 3 * day) },
  { id: "deal_6", clientId: "cli_bee", title: "Influencer program retainer", stage: "PROPOSAL", valueCents: 340000, probability: 0.55, expectedClose: new Date(now + 18 * day), createdAt: new Date(now - 7 * day) },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "cmp_1", clientId: "cli_bee", name: "Spring Bloom Launch", channel: "SOCIAL", status: "ACTIVE", startDate: new Date(now - 10 * day), endDate: new Date(now + 20 * day), budgetCents: 450000, brief: "Launch the new oat-hydrate range across Instagram and TikTok.", createdAt: new Date(now - 24 * day) },
  { id: "cmp_2", clientId: "cli_north", name: "Holiday Gift Guide", channel: "EMAIL", status: "ACTIVE", startDate: new Date(now - 14 * day), endDate: new Date(now + 16 * day), budgetCents: 120000, brief: "Three-part email series for the holiday blend drop.", createdAt: new Date(now - 30 * day) },
  { id: "cmp_3", clientId: "cli_lumen", name: "Brand Foundation", channel: "SEO", status: "ACTIVE", startDate: new Date(now - 10 * day), endDate: new Date(now + 50 * day), budgetCents: 280000, brief: "Onboarding — set up the site structure and first 8 pages.", createdAt: new Date(now - 11 * day) },
  { id: "cmp_4", clientId: "cli_fjord", name: "Membership Drive", channel: "SOCIAL", status: "PAUSED", startDate: new Date(now - 40 * day), endDate: new Date(now - 5 * day), budgetCents: 90000, brief: "Paused pending new creative assets from the client.", createdAt: new Date(now - 45 * day) },
  { id: "cmp_5", clientId: "cli_bee", name: "Evergreen SEO", channel: "SEO", status: "ACTIVE", startDate: new Date(now - 90 * day), endDate: new Date(now + 90 * day), budgetCents: 150000, brief: "Always-on content for ingredient education pages.", createdAt: new Date(now - 90 * day) },
];

const MOCK_CONTENT: ContentItem[] = [
  { id: "cnt_1", clientId: "cli_bee", campaignId: "cmp_1", title: "Oat hydrate, but make it science", body: "We asked our formulator to actually explain what 2% oat panthenol does. Here's the honest answer…", channel: "SOCIAL", status: "DRAFT", generatedBy: "gemini-2.5-flash", scheduledFor: null, externalPostId: null, createdAt: new Date(now - 2 * day), updatedAt: new Date(now - 4 * 3600_000) },
  { id: "cnt_2", clientId: "cli_north", campaignId: "cmp_2", title: "Gift guide email #1 — the warm one", body: "Three roasts, one very cold morning. Here's what we'd pour for each.", channel: "EMAIL", status: "IN_REVIEW", generatedBy: "groq/llama-3.3-70b", scheduledFor: null, externalPostId: null, createdAt: new Date(now - 4 * day), updatedAt: new Date(now - 30 * 3600_000) },
  { id: "cnt_3", clientId: "cli_lumen", campaignId: "cmp_3", title: "Portfolio page — Villa Aster", body: "A project page structured around light, material, and the way a room breathes in the afternoon.", channel: "BLOG", status: "APPROVED", generatedBy: "ollama/llama3.2", scheduledFor: null, externalPostId: null, createdAt: new Date(now - 6 * day), updatedAt: new Date(now - 2 * day) },
  { id: "cnt_4", clientId: "cli_fjord", campaignId: "cmp_4", title: "Class schedule carousel", body: "Seven days, twelve classes, zero excuses. Here's the full week.", channel: "SOCIAL", status: "SCHEDULED", generatedBy: "gemini-2.5-flash", scheduledFor: new Date(now + 1 * day), externalPostId: "ig_88213", createdAt: new Date(now - 8 * day), updatedAt: new Date(now - 1 * day) },
  { id: "cnt_5", clientId: "cli_bee", campaignId: "cmp_5", title: "What does 'clean beauty' actually mean?", body: "A 600-word guide to reading an ingredient list without falling for marketing.", channel: "SEO", status: "PUBLISHED", generatedBy: "ollama/llama3.2", scheduledFor: new Date(now - 5 * day), externalPostId: "wp_4412", createdAt: new Date(now - 15 * day), updatedAt: new Date(now - 5 * day) },
  { id: "cnt_6", clientId: "cli_north", campaignId: "cmp_2", title: "Gift guide email #2 — the bold one", body: "For the person who drinks their coffee black and refuses to talk about it.", channel: "EMAIL", status: "IDEA", generatedBy: null, scheduledFor: null, externalPostId: null, createdAt: new Date(now - 1 * day), updatedAt: new Date(now - 1 * day) },
];

function trendFor(base: number, seed: number): ClientMetrics["trend"] {
  const out: ClientMetrics["trend"] = [];
  let v = base;
  for (let i = 13; i >= 0; i--) {
    const wave = Math.sin((seed + i) * 0.9) * base * 0.18;
    v = base * 0.85 + wave + (13 - i) * base * 0.011;
    out.push({
      date: new Date(now - i * day).toISOString().slice(0, 10),
      value: Math.round(v),
    });
  }
  return out;
}

const MOCK_METRICS: ClientMetrics[] = [
  { clientId: "cli_bee", impressions: 184200, clicks: 12480, visitors: 38900, conversions: 1240, engagementRate: 0.081, trend: trendFor(12480, 1), updatedAt: new Date(now - 2 * 3600_000) },
  { clientId: "cli_north", impressions: 96500, clicks: 7320, visitors: 21400, conversions: 860, engagementRate: 0.064, trend: trendFor(7320, 3), updatedAt: new Date(now - 2 * 3600_000) },
  { clientId: "cli_lumen", impressions: 12800, clicks: 940, visitors: 4800, conversions: 62, engagementRate: 0.052, trend: trendFor(940, 5), updatedAt: new Date(now - 5 * 3600_000) },
  { clientId: "cli_fjord", impressions: 142700, clicks: 8910, visitors: 27600, conversions: 715, engagementRate: 0.072, trend: trendFor(8910, 7), updatedAt: new Date(now - 2 * 3600_000) },
  { clientId: "cli_paper", impressions: 18400, clicks: 1120, visitors: 6300, conversions: 38, engagementRate: 0.031, trend: trendFor(1120, 9), updatedAt: new Date(now - 3 * day) },
];

const MOCK_REPORTS: Report[] = [
  { id: "rep_1", clientId: "cli_bee", title: "March performance recap", periodStart: new Date(now - 31 * day), periodEnd: new Date(now - day), status: "READY", summary: "Spring launch beat plan on impressions and slightly missed on conversion rate — worth a look at the landing page.", highlights: ["Impressions up 24% vs February", "Best performing post: the oat-hydrate explainer", "Conversion rate dipped 0.4pts — landing page A/B test recommended"], pdfUrl: null, createdAt: new Date(now - 1 * day) },
  { id: "rep_2", clientId: "cli_north", title: "Holiday gift guide — mid-campaign", periodStart: new Date(now - 16 * day), periodEnd: new Date(now - day), status: "DRAFT", summary: "Email series is trending above last year's equivalent. Social is flat and needs a nudge.", highlights: ["Open rate 42%, up 9pts", "Social reach down 6%", "Holiday blend restock lands in 5 days"], pdfUrl: null, createdAt: new Date(now - 2 * day) },
  { id: "rep_3", clientId: "cli_fjord", title: "February performance recap", periodStart: new Date(now - 62 * day), periodEnd: new Date(now - 32 * day), status: "SENT", summary: "Membership campaign paused with creative still outstanding. Reach held steady.", highlights: ["Reach flat at 142k", "Carousel drove 38% of class signups", "Awaiting new creative assets"], pdfUrl: "/reports/fjord-february.pdf", createdAt: new Date(now - 30 * day) },
  { id: "rep_4", clientId: "cli_lumen", title: "Onboarding — week 2 summary", periodStart: new Date(now - 12 * day), periodEnd: new Date(now - day), status: "READY", summary: "Site structure is live and the first four pages are drafted. Traffic is still climbing from zero, as expected.", highlights: ["4 pages drafted, 2 published", "Keyword map complete for 40 terms", "First organic session recorded"], pdfUrl: null, createdAt: new Date(now - 1 * day) },
];

// ---------- Contract implementation ----------

export async function getDashboardData(): Promise<DashboardData> {
  const activeClients = MOCK_CLIENTS.filter((c) => c.status === "ACTIVE");
  const openDeals = MOCK_DEALS.filter(
    (d) => d.stage !== "WON" && d.stage !== "LOST",
  );
  const pipelineValueCents = openDeals.reduce(
    (sum, d) => sum + d.valueCents,
    0,
  );
  const contentInFlight = MOCK_CONTENT.filter(
    (c) => !["PUBLISHED", "ARCHIVED"].includes(c.status),
  ).length;
  const mrrCents = activeClients.reduce((sum, c) => sum + c.retainerCents, 0);

  const attention: DashboardData["attention"] = [];

  const draftsInReview = MOCK_CONTENT.filter((c) => c.status === "IN_REVIEW");
  if (draftsInReview.length) {
    attention.push({
      id: "attn_review",
      icon: "preview",
      title: `${draftsInReview.length} draft${draftsInReview.length > 1 ? "s" : ""} waiting on a thumbs-up`,
      detail: draftsInReview
        .map((d) => MOCK_CLIENTS.find((c) => c.id === d.clientId)?.name)
        .filter(Boolean)
        .join(", "),
      href: "/content-studio",
      tone: "butter",
    });
  }

  const dealsClosing = openDeals.filter((d) => {
    if (!d.expectedClose) return false;
    const days = (d.expectedClose.getTime() - now) / day;
    return days <= 14 && days >= 0;
  });
  if (dealsClosing.length) {
    attention.push({
      id: "attn_deals",
      icon: "goal",
      title: `${dealsClosing.length} deal${dealsClosing.length > 1 ? "s" : ""} closing within two weeks`,
      detail: dealsClosing.map((d) => d.title).join(" · "),
      href: "/pipeline",
      tone: "peach",
    });
  }

  const unhealthy = MOCK_CLIENTS.filter((c) => c.healthScore < 70);
  if (unhealthy.length) {
    attention.push({
      id: "attn_health",
      icon: "health",
      title: `${unhealthy.length} client${unhealthy.length > 1 ? "s" : ""} could use a check-in`,
      detail: unhealthy
        .map((c) => `${c.name} (${c.healthScore})`)
        .join(", "),
      href: "/clients",
      tone: "sky",
    });
  }

  if (!attention.length) {
    attention.push({
      id: "attn_clear",
      icon: "party",
      title: "All clear — nothing on fire",
      detail: "Every client is healthy and no approvals are pending.",
      href: "/dashboard",
      tone: "mint",
    });
  }

  return {
    agencyName: "Brightside Studio",
    totals: {
      clients: MOCK_CLIENTS.length,
      activeClients: activeClients.length,
      openDeals: openDeals.length,
      pipelineValueCents,
      contentInFlight,
      mrrCents,
    },
    clients: MOCK_CLIENTS,
    deals: MOCK_DEALS,
    recentContent: [...MOCK_CONTENT].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    ),
    metrics: MOCK_METRICS,
    reports: MOCK_REPORTS,
    attention,
  };
}

export async function getClients(): Promise<Client[]> {
  return MOCK_CLIENTS;
}

export async function getClientBySlug(
  slug: string,
): Promise<ClientDetail | null> {
  const client = MOCK_CLIENTS.find((c) => c.slug === slug);
  if (!client) return null;

  return {
    ...client,
    contactList: MOCK_CONTACTS.filter((c) => c.clientId === client.id),
    dealList: MOCK_DEALS.filter((d) => d.clientId === client.id),
    campaignList: MOCK_CAMPAIGNS.filter((c) => c.clientId === client.id),
    contentList: MOCK_CONTENT.filter((c) => c.clientId === client.id),
    metrics: MOCK_METRICS.find((m) => m.clientId === client.id) ?? null,
    reportList: MOCK_REPORTS.filter((r) => r.clientId === client.id),
  };
}

export async function getContent(
  filters: ContentFilters = {},
): Promise<ContentItem[]> {
  let items = [...MOCK_CONTENT];
  if (filters.clientId) {
    items = items.filter((c) => c.clientId === filters.clientId);
  }
  if (filters.status) {
    items = items.filter((c) => c.status === filters.status);
  }
  if (filters.channel) {
    items = items.filter((c) => c.channel === filters.channel);
  }
  items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return filters.limit ? items.slice(0, filters.limit) : items;
}

export async function getReports(): Promise<Report[]> {
  return [...MOCK_REPORTS].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function getDeals(): Promise<Deal[]> {
  return MOCK_DEALS;
}

export async function getCampaigns(): Promise<Campaign[]> {
  return MOCK_CAMPAIGNS;
}

/** Resolve a client id to a display name, for joining across entities. */
export async function getClientName(id: string): Promise<string> {
  return MOCK_CLIENTS.find((c) => c.id === id)?.name ?? "Unknown client";
}

/** Most recent activity, used in activity feeds. */
export async function getRecentActivity(limit = 8) {
  return [...MOCK_CONTENT]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit)
    .map((c) => ({
      id: c.id,
      icon:
        c.status === "PUBLISHED"
          ? "launch"
          : c.status === "APPROVED"
            ? "check"
            : c.status === "IN_REVIEW"
              ? "preview"
              : "content",
      title: c.title,
      clientName: MOCK_CLIENTS.find((cl) => cl.id === c.clientId)?.name ?? "",
      when: formatRelative(c.updatedAt),
    }));
}

// ---------- Mutations ----------
// Shared write contract. In-memory for now; the Prisma layer replaces these
// bodies without touching any caller.

export async function updateContentItem(
  id: string,
  patch: Partial<Pick<ContentItem, "title" | "body" | "status" | "scheduledFor" | "generatedBy" | "channel" | "campaignId">>,
): Promise<ContentItem | null> {
  const item = MOCK_CONTENT.find((c) => c.id === id);
  if (!item) return null;
  Object.assign(item, patch, { updatedAt: new Date() });
  return item;
}

export async function createContentItem(
  input: Pick<ContentItem, "clientId" | "title" | "body" | "channel"> &
    Partial<Pick<ContentItem, "campaignId" | "status" | "generatedBy">>,
): Promise<ContentItem> {
  const item: ContentItem = {
    id: `cnt_${Math.random().toString(36).slice(2, 9)}`,
    clientId: input.clientId,
    campaignId: input.campaignId ?? null,
    title: input.title,
    body: input.body,
    channel: input.channel,
    status: input.status ?? "DRAFT",
    generatedBy: input.generatedBy ?? null,
    scheduledFor: null,
    externalPostId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  MOCK_CONTENT.unshift(item);
  return item;
}

export async function updateDealStage(
  id: string,
  stage: Deal["stage"],
): Promise<Deal | null> {
  const deal = MOCK_DEALS.find((d) => d.id === id);
  if (!deal) return null;
  deal.stage = stage;
  return deal;
}

export async function updateReport(
  id: string,
  patch: Partial<Pick<Report, "title" | "summary" | "highlights" | "status" | "pdfUrl">>,
): Promise<Report | null> {
  const report = MOCK_REPORTS.find((r) => r.id === id);
  if (!report) return null;
  Object.assign(report, patch);
  return report;
}

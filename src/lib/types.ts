/**
 * Agency OS — shared domain types.
 * These are the contracts the data layer, AI layer, and UI layer all agree on.
 * Kept dependency-free so any layer can import them without pulling the others in.
 */

// ---------- Tenancy & people ----------

export const ROLES = ["OWNER", "MANAGER", "EDITOR", "CLIENT"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  EDITOR: "Editor",
  CLIENT: "Client",
};

export interface Agency {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  agencyId: string;
  avatarUrl?: string | null;
}

export interface Client {
  id: string;
  agencyId: string;
  name: string;
  slug: string;
  industry?: string | null;
  website?: string | null;
  status: ClientStatus;
  /** 0-100, drives the health score ring */
  healthScore: number;
  retainerCents: number;
  color: AccentColor;
  avatarUrl?: string | null;
  contactIds: string[];
  createdAt: Date;
}

export const CLIENT_STATUSES = ["ACTIVE", "ONBOARDING", "PAUSED", "CHURNED"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  ACTIVE: "Active",
  ONBOARDING: "Onboarding",
  PAUSED: "Paused",
  CHURNED: "Churned",
};

/** The pastel palette, used for client color-coding. */
export const ACCENT_COLORS = ["mint", "peach", "sky", "butter", "lilac"] as const;
export type AccentColor = (typeof ACCENT_COLORS)[number];

export interface Contact {
  id: string;
  clientId: string;
  name: string;
  email: string;
  role?: string | null;
  isPrimary: boolean;
}

// ---------- Pipeline (CRM) ----------

export const DEAL_STAGES = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  LEAD: "Lead",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export interface Deal {
  id: string;
  clientId: string;
  title: string;
  stage: DealStage;
  valueCents: number;
  probability: number;
  expectedClose?: Date | null;
  createdAt: Date;
}

// ---------- Campaigns & content ----------

export const CHANNELS = ["SOCIAL", "EMAIL", "SEO", "SEM", "BLOG"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  SOCIAL: "Social",
  EMAIL: "Email",
  SEO: "SEO",
  SEM: "Paid",
  BLOG: "Blog",
};

export const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  channel: Channel;
  status: CampaignStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  budgetCents?: number | null;
  brief?: string | null;
  createdAt: Date;
}

export const CONTENT_STATUSES = [
  "IDEA",
  "DRAFTING",
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  IDEA: "Idea",
  DRAFTING: "Drafting",
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

export interface ContentItem {
  id: string;
  clientId: string;
  campaignId?: string | null;
  title: string;
  body: string;
  channel: Channel;
  status: ContentStatus;
  /** Provider id + model id used for generation, for reproducibility. */
  generatedBy?: string | null;
  scheduledFor?: Date | null;
  externalPostId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------- Metrics & reports ----------

export interface MetricPoint {
  date: string;
  value: number;
}

export interface ClientMetrics {
  clientId: string;
  impressions: number;
  clicks: number;
  visitors: number;
  conversions: number;
  engagementRate: number;
  /** Period-over-period change as a fraction, e.g. 0.12 = +12% */
  trend: MetricPoint[];
  updatedAt: Date;
}

export const REPORT_STATUSES = ["DRAFT", "READY", "SENT"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface Report {
  id: string;
  clientId: string;
  title: string;
  periodStart: Date;
  periodEnd: Date;
  status: ReportStatus;
  summary: string;
  highlights: string[];
  pdfUrl?: string | null;
  createdAt: Date;
}

// ---------- AI providers ----------

export const PROVIDER_KINDS = ["OPENAI_COMPATIBLE", "OLLAMA", "ANTHROPIC"] as const;
export type ProviderKind = (typeof PROVIDER_KINDS)[number];

export interface AiProvider {
  id: string;
  agencyId: string;
  label: string;
  kind: ProviderKind;
  baseUrl: string;
  /** Never returned to the client — write-only. */
  apiKey?: string | null;
  /** Model ids the user picked from the fetched list. */
  models: string[];
  isDefault: boolean;
  createdAt: Date;
}

export interface AiModel {
  id: string;
  /** Some providers return extra metadata; keep it loose. */
  label?: string;
  contextLength?: number | null;
}

export const TASK_KINDS = [
  "CONTENT_DRAFT",
  "SOCIAL_VARIANTS",
  "SEO_META",
  "SUMMARY",
  "TRANSLATE",
] as const;
export type TaskKind = (typeof TASK_KINDS)[number];

export interface GenerateRequest {
  providerId: string;
  model: string;
  task: TaskKind;
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
  providerId: string;
  tokensUsed?: number;
  latencyMs: number;
}

import type {
  Campaign,
  Channel,
  Client,
  ContentItem,
  ContentStatus,
  TaskKind,
} from "@/lib/types";

/**
 * Shapes shared between the content-studio server page and its client
 * components. Kept in one place so the page and the board can’t drift.
 */

export interface StudioClient {
  id: string;
  name: string;
  industry: string | null;
  color: Client["color"];
}

export interface StudioCampaign {
  id: string;
  clientId: string;
  name: string;
  channel: Channel;
  status: string;
}

export interface StudioContent {
  id: string;
  clientId: string;
  campaignId: string | null;
  title: string;
  body: string;
  channel: Channel;
  status: ContentStatus;
  generatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudioProvider {
  id: string;
  label: string;
  kind: string;
  baseUrl: string;
  apiKey: string | null;
  hasApiKey: boolean;
  models: string[];
  isDefault: boolean;
  createdAt: string;
}

/** Alias kept for readability at call sites that talk about providers. */
export type PublicProvider = StudioProvider;

export type { Campaign, Channel, Client, ContentItem, ContentStatus, TaskKind };

/** Map domain objects to the plain-JSON shapes that cross the wire. */
export function toStudioClients(clients: Client[]): StudioClient[] {
  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    industry: c.industry ?? null,
    color: c.color,
  }));
}

export function toStudioCampaigns(campaigns: Campaign[]): StudioCampaign[] {
  return campaigns.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    name: c.name,
    channel: c.channel,
    status: c.status,
  }));
}

export function toStudioContent(items: ContentItem[]): StudioContent[] {
  return items.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    campaignId: c.campaignId ?? null,
    title: c.title,
    body: c.body,
    channel: c.channel,
    status: c.status,
    generatedBy: c.generatedBy ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

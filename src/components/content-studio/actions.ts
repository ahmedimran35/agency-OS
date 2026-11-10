"use server";

import {
  createContentItem,
  updateContentItem,
} from "@/lib/data";
import type { Channel, ContentStatus } from "@/lib/types";

/**
 * Content mutations for the Content Studio.
 *
 * The write contract lives in src/lib/data.ts; these actions are the thin
 * server-side bridge the client components use to reach it. Swapping the
 * mock for Prisma later means changing data.ts, not these.
 */

export interface SaveContentInput {
  clientId: string;
  campaignId?: string | null;
  title: string;
  body: string;
  channel: Channel;
  status: ContentStatus;
  generatedBy?: string | null;
}

export interface EditContentInput {
  id: string;
  title: string;
  body: string;
  status?: ContentStatus;
}

/** Dates don’t survive the server -> client boundary as Dates, so stringify. */
function serialize(item: {
  id: string;
  clientId: string;
  campaignId?: string | null;
  title: string;
  body: string;
  channel: Channel;
  status: ContentStatus;
  generatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: item.id,
    clientId: item.clientId,
    campaignId: item.campaignId ?? null,
    title: item.title,
    body: item.body,
    channel: item.channel,
    status: item.status,
    generatedBy: item.generatedBy ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function saveContentAction(input: SaveContentInput) {
  try {
    if (!input.clientId) {
      return { ok: false as const, error: "Pick a client for this draft first." };
    }
    if (!input.title.trim()) {
      return { ok: false as const, error: "Give the draft a title." };
    }

    const created = await createContentItem({
      clientId: input.clientId,
      campaignId: input.campaignId ?? null,
      title: input.title.trim(),
      body: input.body ?? "",
      channel: input.channel,
      status: input.status,
      generatedBy: input.generatedBy ?? null,
    });

    return { ok: true as const, content: serialize(created) };
  } catch (error) {
    console.error("[content-studio] saveContentAction failed", error);
    return {
      ok: false as const,
      error: "Couldn't save that draft. Give it another go.",
    };
  }
}

export async function editContentAction(input: EditContentInput) {
  try {
    if (!input.id) {
      return { ok: false as const, error: "Which draft should we update?" };
    }

    const updated = await updateContentItem(input.id, {
      title: input.title,
      body: input.body,
      ...(input.status ? { status: input.status } : {}),
    });

    if (!updated) {
      return { ok: false as const, error: "We couldn’t find that draft." };
    }

    return { ok: true as const, content: serialize(updated) };
  } catch (error) {
    console.error("[content-studio] editContentAction failed", error);
    return {
      ok: false as const,
      error: "Couldn't save those changes. Give it another go.",
    };
  }
}

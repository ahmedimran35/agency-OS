import { NextResponse } from "next/server";
import {
  createProvider,
  deleteProvider,
  listProviders,
  toPublicProvider,
  updateProvider,
} from "@/lib/ai/store";
import type { ProviderKind } from "@/lib/types";

/**
 * GET  /api/ai/providers — list configured providers (API keys masked)
 * POST /api/ai/providers — add a provider
 */

const VALID_KINDS: ProviderKind[] = ["OPENAI_COMPATIBLE", "OLLAMA", "ANTHROPIC"];

export async function GET() {
  try {
    const providers = listProviders().map(toPublicProvider);
    return NextResponse.json({ ok: true, providers });
  } catch (error) {
    console.error("[api/ai/providers] GET failed", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't load the provider list." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "That request body wasn’t valid JSON." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "We need a provider to add." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  const label = typeof payload.label === "string" ? payload.label.trim() : "";
  const baseUrl = typeof payload.baseUrl === "string" ? payload.baseUrl.trim() : "";
  const apiKey =
    typeof payload.apiKey === "string" && payload.apiKey.trim()
      ? payload.apiKey.trim()
      : null;
  const kindRaw = typeof payload.kind === "string" ? payload.kind : "";
  const kind = (VALID_KINDS as string[]).includes(kindRaw)
    ? (kindRaw as ProviderKind)
    : "OPENAI_COMPATIBLE";
  const models = Array.isArray(payload.models)
    ? payload.models.filter((m): m is string => typeof m === "string")
    : [];
  const isDefault = payload.isDefault === true;

  if (!label) {
    return NextResponse.json(
      { ok: false, error: "Give the provider a name so you can tell them apart." },
      { status: 400 },
    );
  }
  if (!baseUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "That provider needs a base URL — the API root, usually ending in /v1.",
      },
      { status: 400 },
    );
  }

  try {
    const provider = createProvider({ label, baseUrl, apiKey, kind, models, isDefault });
    return NextResponse.json(
      { ok: true, provider: toPublicProvider(provider) },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/ai/providers] POST failed", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't save that provider." },
      { status: 500 },
    );
  }
}

/** PATCH /api/ai/providers — update an existing provider. */
export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "That request body wasn’t valid JSON." },
      { status: 400 },
    );
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const id = typeof payload.id === "string" ? payload.id : "";
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Which provider should we update?" },
      { status: 400 },
    );
  }

  const patch: Parameters<typeof updateProvider>[1] = {};
  if (typeof payload.label === "string") patch.label = payload.label;
  if (typeof payload.baseUrl === "string") patch.baseUrl = payload.baseUrl;
  if (typeof payload.kind === "string" && (VALID_KINDS as string[]).includes(payload.kind)) {
    patch.kind = payload.kind as ProviderKind;
  }
  if (Array.isArray(payload.models)) {
    patch.models = payload.models.filter((m): m is string => typeof m === "string");
  }
  if (typeof payload.isDefault === "boolean") patch.isDefault = payload.isDefault;
  // An empty string means "leave the key alone" — we never send a raw key back.
  if (typeof payload.apiKey === "string" && payload.apiKey.trim()) {
    patch.apiKey = payload.apiKey.trim();
  }

  const updated = updateProvider(id, patch);
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "We couldn’t find that provider." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, provider: toPublicProvider(updated) });
}

/** DELETE /api/ai/providers — remove a provider by id. */
export async function DELETE(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "That request body wasn’t valid JSON." },
      { status: 400 },
    );
  }

  const id = (body as Record<string, unknown> | null)?.id;
  if (typeof id !== "string" || !id) {
    return NextResponse.json(
      { ok: false, error: "Which provider should we remove?" },
      { status: 400 },
    );
  }

  const removed = deleteProvider(id);
  if (!removed) {
    return NextResponse.json(
      { ok: false, error: "We couldn’t find that provider." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, providers: listProviders().map(toPublicProvider) });
}

import { NextResponse } from "next/server";
import { fetchModels } from "@/lib/ai/providers";
import type { ProviderKind } from "@/lib/types";

/**
 * POST /api/ai/models — capability probe.
 *
 * Body: { baseUrl, apiKey?, kind? }
 * Response: { ok: true, models: AiModel[] } | { ok: false, error: string }
 */

const VALID_KINDS: ProviderKind[] = ["OPENAI_COMPATIBLE", "OLLAMA", "ANTHROPIC"];

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

  const payload = (body ?? {}) as Record<string, unknown>;
  const baseUrl = typeof payload.baseUrl === "string" ? payload.baseUrl.trim() : "";
  const apiKey =
    typeof payload.apiKey === "string" && payload.apiKey.trim()
      ? payload.apiKey.trim()
      : undefined;
  const kindRaw = typeof payload.kind === "string" ? payload.kind : "";
  const kind = (VALID_KINDS as string[]).includes(kindRaw)
    ? (kindRaw as ProviderKind)
    : "OPENAI_COMPATIBLE";

  if (!baseUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: "Add the endpoint's base URL first — that’s the bit we fetch models from.",
      },
      { status: 400 },
    );
  }

  const result = await fetchModels({ baseUrl, apiKey, kind });

  if (!result.ok) {
    // 400 for "you gave us something we can’t work with", 502 for "they said no".
    const status = /base URL|needs a base/i.test(result.error) ? 400 : 502;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, models: result.models });
}

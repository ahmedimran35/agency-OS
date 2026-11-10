import { NextResponse } from "next/server";
import { generateText, TASK_SYSTEM_PROMPTS } from "@/lib/ai/providers";
import { getDefaultProvider, getProviderWithKey } from "@/lib/ai/store";
import { TASK_KINDS, type TaskKind } from "@/lib/types";

/**
 * POST /api/ai/generate — write something.
 *
 * Body: { providerId?, model?, task, prompt, system?, temperature?, maxTokens? }
 * Response: { ok: true, result: GenerateResult } | { ok: false, error }
 *
 * We never fabricate output. If the provider is unreachable, you get a
 * sentence telling you why and what to do about it.
 */

const VALID_TASKS: TaskKind[] = [
  "CONTENT_DRAFT",
  "SOCIAL_VARIANTS",
  "SEO_META",
  "SUMMARY",
  "TRANSLATE",
];

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

  const taskRaw = typeof payload.task === "string" ? payload.task : "";
  if (!(VALID_TASKS as string[]).includes(taskRaw)) {
    return NextResponse.json(
      { ok: false, error: "We don’t know what kind of writing that is." },
      { status: 400 },
    );
  }
  const task = taskRaw as TaskKind;

  const prompt = typeof payload.prompt === "string" ? payload.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json(
      { ok: false, error: "The brief is empty — there's nothing to write from yet." },
      { status: 400 },
    );
  }

  const providerId =
    typeof payload.providerId === "string" && payload.providerId.trim()
      ? payload.providerId.trim()
      : null;

  const found = providerId
    ? getProviderWithKey(providerId)
    : (() => {
        const fallback = getDefaultProvider();
        return fallback
          ? { provider: fallback, apiKey: fallback.apiKey ?? null }
          : null;
      })();

  if (!found) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "No AI provider is set up yet. Add one under AI Providers and we’ll get drafting.",
      },
      { status: 400 },
    );
  }

  const { provider, apiKey } = found;

  const model =
    typeof payload.model === "string" && payload.model.trim()
      ? payload.model.trim()
      : (provider.models[0] ?? "");

  if (!model) {
    return NextResponse.json(
      {
        ok: false,
        error: `Pick a model for ${provider.label} first — we don’t want to guess.`,
      },
      { status: 400 },
    );
  }

  const system =
    typeof payload.system === "string" && payload.system.trim()
      ? payload.system.trim()
      : TASK_SYSTEM_PROMPTS[task];

  const temperature =
    typeof payload.temperature === "number" &&
    Number.isFinite(payload.temperature)
      ? Math.min(Math.max(payload.temperature, 0), 2)
      : 0.7;

  const maxTokens =
    typeof payload.maxTokens === "number" && Number.isFinite(payload.maxTokens)
      ? Math.min(Math.max(Math.round(payload.maxTokens), 64), 8192)
      : 900;

  const result = await generateText({
    providerId: provider.id,
    baseUrl: provider.baseUrl,
    apiKey,
    kind: provider.kind,
    model,
    task,
    prompt,
    system,
    temperature,
    maxTokens,
  });

  if (!result.ok) {
    const error = result.error;

    // A local Ollama that isn’t running is the single most common stumble.
    const ollamaHint =
      provider.kind === "OLLAMA" &&
      /couldn't reach|could not reach|failed to fetch|network|unreachable|ECONNREFUSED/i.test(
        error,
      )
        ? " Ollama doesn’t look like it’s running — start it with `ollama serve`, then pull a model with `ollama pull llama3.2`."
        : "";

    return NextResponse.json(
      { ok: false, error: `${error}${ollamaHint}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, result: result.result });
}

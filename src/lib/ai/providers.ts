import type {
  AiModel,
  AiProvider,
  GenerateRequest,
  GenerateResult,
  ProviderKind,
  TaskKind,
} from "@/lib/types";

/**
 * Provider registry — one adapter for every OpenAI-compatible endpoint.
 *
 * The product rule: the user adds ANY OpenAI-compatible base URL + API key,
 * we FETCH the model list from that endpoint, and the user SELECTS from what
 * we found. Free-tier presets exist so the common case is zero-typing.
 *
 * Nothing here is provider-specific beyond config, which is exactly the point:
 * adding Gemini, Groq, OpenRouter, Ollama, LM Studio, vLLM, Together or
 * DeepSeek is configuration, not code.
 */

// ---------- Presets ----------

export interface ProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  apiKey?: string;
  kind: ProviderKind;
  defaultModels: string[];
  notes: string;
  requiresApiKey: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "gemini",
    label: "Google Gemini (free tier)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    kind: "OPENAI_COMPATIBLE",
    defaultModels: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"],
    notes:
      "Flash-class models are free on the Gemini API. Grab a key at aistudio.google.com and paste it in.",
    requiresApiKey: true,
  },
  {
    id: "groq",
    label: "Groq (free tier)",
    baseUrl: "https://api.groq.com/openai/v1",
    kind: "OPENAI_COMPATIBLE",
    defaultModels: ["gpt-oss-120b", "llama-3.3-70b-versatile"],
    notes:
      "Very fast, and the free tier is generous enough for a whole agency's worth of drafts.",
    requiresApiKey: true,
  },
  {
    id: "openrouter",
    label: "OpenRouter (free models)",
    baseUrl: "https://openrouter.ai/api/v1",
    kind: "OPENAI_COMPATIBLE",
    defaultModels: [
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.3-70b-instruct:free",
    ],
    notes:
      "Models ending in :free cost nothing. The model list is browsable without a key, so you can fetch first and add a key later.",
    requiresApiKey: false,
  },
  {
    id: "ollama",
    label: "Ollama (local — unlimited)",
    baseUrl: "http://localhost:11434/v1",
    kind: "OLLAMA",
    defaultModels: ["llama3.2", "qwen2.5", "gemma3", "phi4"],
    notes:
      "Runs on your own machine: no key, no quota, no bill. Start it with `ollama serve` and pull a model first.",
    requiresApiKey: false,
  },
  {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    baseUrl: "",
    kind: "OPENAI_COMPATIBLE",
    defaultModels: [],
    notes:
      "Anything that speaks the OpenAI API: LM Studio, vLLM, llama.cpp, TGI, Together, DeepSeek, your own gateway.",
    requiresApiKey: false,
  },
];

export function getPreset(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

// ---------- URL normalisation ----------

/**
 * OpenAI-compatible servers almost all expose their API under a `/v1` path.
 * Users paste bases in every conceivable shape ("…/v1", "…/v1/", "…"), so we
 * normalise to a single canonical form before building request URLs.
 */
export function normalizeBaseUrl(baseUrl: string, kind: ProviderKind): string {
  let url = (baseUrl ?? "").trim();
  if (!url) return "";

  url = url.replace(/\/+$/, "");
  if (!url) return "";

  // Only OpenAI-compatible endpoints get the `/v1` suffix forced on.
  // Ollama is already addressed explicitly and its native API is `/api/*`.
  if (kind === "OPENAI_COMPATIBLE" && !/\/v\d+$/.test(url)) {
    url = `${url}/v1`;
  }
  return url;
}

function modelsEndpoint(baseUrl: string, kind: ProviderKind): string {
  const base = normalizeBaseUrl(baseUrl, kind);
  return `${base}/models`;
}

function chatEndpoint(baseUrl: string, kind: ProviderKind): string {
  const base = normalizeBaseUrl(baseUrl, kind);
  return `${base}/chat/completions`;
}

// ---------- Shared fetch helpers ----------

const REQUEST_TIMEOUT_MS = 15_000;

function authHeaders(apiKey?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (apiKey && apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`;
  }
  return headers;
}

/** Turn a thrown fetch/abort error into something a human can act on. */
function describeNetworkError(error: unknown, url: string): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return `That endpoint didn’t answer within 15 seconds. It may be down, or the base URL might be wrong (we tried ${url}).`;
  }
  if (error instanceof TypeError) {
    return `Couldn't reach ${url}. Check the base URL, your network, and — for local models like Ollama — that the server is actually running.`;
  }
  const message = error instanceof Error ? error.message : String(error);
  return `Couldn't reach ${url}. ${message}`;
}

// ---------- Model discovery ----------

export type FetchModelsResult =
  | { ok: true; models: AiModel[] }
  | { ok: false; error: string };

/**
 * Pull the model list from an OpenAI-compatible endpoint.
 *
 * Tolerates the shapes we actually see in the wild:
 *   - `{ data: [{ id }] }`   — the OpenAI standard (also Gemini, Groq, Ollama /v1)
 *   - `[ { id } ]`           — a bare array
 *   - `{ models: [{ id }] }` — some gateways and Ollama's native /api/tags
 */
export async function fetchModels(config: {
  baseUrl: string;
  apiKey?: string | null;
  kind?: ProviderKind;
}): Promise<FetchModelsResult> {
  const kind = config.kind ?? "OPENAI_COMPATIBLE";
  const base = normalizeBaseUrl(config.baseUrl, kind);

  if (!base) {
    return {
      ok: false,
      error:
        "That endpoint needs a base URL first — something like https://api.example.com/v1",
    };
  }

  const url = modelsEndpoint(config.baseUrl, kind);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: authHeaders(config.apiKey),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    return { ok: false, error: describeNetworkError(error, url) };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const trimmed = detail.slice(0, 200).trim();
    const authHint =
      response.status === 401 || response.status === 403
        ? " That usually means the API key is missing or wrong."
        : "";
    return {
      ok: false,
      error: `The endpoint answered ${response.status} ${response.statusText}.${authHint}${trimmed ? ` ${trimmed}` : ""}`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: `The endpoint replied with something that isn’t JSON. Double-check the base URL points at the API root (usually ending in /v1).`,
    };
  }

  const models = parseModels(payload);
  if (!models.length) {
    return {
      ok: false,
      error:
        "Connected, but that endpoint didn’t list any models. Check the base URL — most need a /v1 suffix.",
    };
  }

  return { ok: true, models };
}

/** Pull model ids out of the various response shapes. */
export function parseModels(payload: unknown): AiModel[] {
  let raw: unknown = [];

  if (Array.isArray(payload)) {
    raw = payload;
  } else if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const candidate = record.data ?? record.models;
    raw = Array.isArray(candidate) ? candidate : [];
  }

  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const models: AiModel[] = [];

  for (const entry of raw) {
    if (typeof entry === "string") {
      // A bare array of strings: ["gpt-4o", ...]
      if (entry && !seen.has(entry)) {
        seen.add(entry);
        models.push({ id: entry });
      }
      continue;
    }
    if (!entry || typeof entry !== "object") continue;

    const record = entry as Record<string, unknown>;
    const id =
      typeof record.id === "string"
        ? record.id
        : typeof record.name === "string"
          ? record.name
          : typeof record.model === "string"
            ? record.model
            : null;
    if (!id || seen.has(id)) continue;

    seen.add(id);

    const label =
      typeof record.display_name === "string"
        ? record.display_name
        : typeof record.label === "string"
          ? record.label
          : typeof record.description === "string"
            ? record.description
            : undefined;

    const contextLength =
      typeof record.context_length === "number"
        ? record.context_length
        : typeof record.context_window === "number"
          ? record.context_window
          : typeof record.max_context_length === "number"
            ? record.max_context_length
            : null;

    models.push({ id, label, contextLength });
  }

  return models;
}

// ---------- Generation ----------

export interface GenerateInput extends Omit<GenerateRequest, "providerId"> {
  providerId?: string;
  baseUrl: string;
  apiKey?: string | null;
  kind?: ProviderKind;
}

/**
 * Call an OpenAI-compatible `/chat/completions` endpoint.
 *
 * Never throws: failures come back as `{ ok: false, error }` so the UI can
 * show something kind and actionable instead of a stack trace.
 */
export type GenerateTextResult =
  | { ok: true; result: GenerateResult }
  | { ok: false; error: string };

export async function generateText(
  input: GenerateInput,
): Promise<GenerateTextResult> {
  const kind = input.kind ?? "OPENAI_COMPATIBLE";
  const base = normalizeBaseUrl(input.baseUrl, kind);

  if (!base) {
    return {
      ok: false,
      error: "That provider doesn’t have a base URL yet. Add one in AI Providers first.",
    };
  }
  if (!input.model?.trim()) {
    return { ok: false, error: "Pick a model before we try to write something." };
  }
  if (!input.prompt?.trim()) {
    return { ok: false, error: "Give the brief a little something to work with first." };
  }

  const url = chatEndpoint(input.baseUrl, kind);
  const system =
    input.system?.trim() ||
    TASK_SYSTEM_PROMPTS[input.task] ||
    TASK_SYSTEM_PROMPTS.CONTENT_DRAFT;

  const body = {
    model: input.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: input.prompt },
    ],
    temperature: input.temperature ?? 0.7,
    max_tokens: input.maxTokens ?? 900,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: authHeaders(input.apiKey),
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        error:
          "The model took longer than 60 seconds to answer. Try a smaller model, or a shorter brief.",
      };
    }
    return { ok: false, error: describeNetworkError(error, url) };
  }
  clearTimeout(timer);

  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const trimmed = detail.slice(0, 300).trim();
    const authHint =
      response.status === 401 || response.status === 403
        ? " That usually means the API key is missing, wrong, or expired."
        : response.status === 429
          ? " That's a rate limit — you've hit this provider's free-tier cap."
          : "";
    return {
      ok: false,
      error: `The model endpoint answered ${response.status} ${response.statusText}.${authHint}${trimmed ? ` ${trimmed}` : ""}`,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      error: "The model replied with something that isn’t JSON. Is the base URL an API endpoint?",
    };
  }

  const text = extractText(payload);
  if (!text) {
    return {
      ok: false,
      error:
        "The model came back empty-handed. It may have hit a content filter, or the response shape is unusual.",
    };
  }

  const usage = extractUsage(payload);

  return {
    ok: true,
    result: {
      text,
      model: input.model,
      providerId: input.providerId ?? "unknown",
      tokensUsed: usage,
      latencyMs,
    },
  };
}

/** Pull the assistant message out of a chat-completions style response. */
export function extractText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;

  const choices = record.choices;
  if (Array.isArray(choices) && choices.length) {
    const first = choices[0] as Record<string, unknown>;

    const message = first?.message as Record<string, unknown> | undefined;
    if (message && typeof message.content === "string") {
      return message.content.trim();
    }
    // Some gateways put content in an array of parts.
    if (message && Array.isArray(message.content)) {
      const joined = message.content
        .map((part) =>
          part && typeof part === "object" && typeof (part as Record<string, unknown>).text === "string"
            ? (part as Record<string, string>).text
            : "",
        )
        .join("")
        .trim();
      if (joined) return joined;
    }
    // Completion-style (not chat) responses.
    if (typeof first?.text === "string") {
      return first.text.trim();
    }
  }

  // Ollama's native shape: { message: { content } }
  const topMessage = record.message as Record<string, unknown> | undefined;
  if (topMessage && typeof topMessage.content === "string") {
    return topMessage.content.trim();
  }
  if (typeof record.response === "string") {
    return record.response.trim();
  }

  return "";
}

function extractUsage(payload: unknown): number | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const usage = (payload as Record<string, unknown>).usage as
    | Record<string, unknown>
    | undefined;
  if (!usage) return undefined;

  const total = usage.total_tokens ?? usage.totalTokens;
  if (typeof total === "number") return total;

  const prompt = usage.prompt_tokens;
  const completion = usage.completion_tokens;
  if (typeof prompt === "number" && typeof completion === "number") {
    return prompt + completion;
  }
  return undefined;
}

// ---------- Task prompts ----------

/**
 * One system prompt per task kind. These are the difference between
 * "technically a draft" and "a draft a client would actually approve".
 */
export const TASK_SYSTEM_PROMPTS: Record<TaskKind, string> = {
  CONTENT_DRAFT: [
    "You are the senior copywriter at a small, sharp digital marketing agency.",
    "Write genuinely compelling marketing copy that sounds like a real person typed it.",
    "",
    "Rules:",
    "- Lead with the most interesting, concrete detail — never open with 'In today's fast-paced world'.",
    "- Write in the brand voice described in the brief. If no voice is given, use warm, plain, confident language.",
    "- Be specific. Real numbers, real product names, real benefits. No vague filler.",
    "- Cut every cliché, every pun that strains, and every 'we're excited to announce'.",
    "- Use emoji sparingly — only when the channel is social and only where it genuinely helps.",
    "- Match the requested length closely. Short means short.",
    "- Structure with short paragraphs and a clear rhythm. Assume the reader is scrolling.",
    "",
    "Output ONLY the finished copy. No preamble, no explanations, no markdown headers, no 'Here is your draft'.",
  ].join("\n"),

  SOCIAL_VARIANTS: [
    "You write social media posts for a digital marketing agency serving multiple clients.",
    "Produce distinct, platform-native variants of the same message — never the same sentence with the words shuffled.",
    "",
    "Rules:",
    "- Give each variant a genuinely different angle: one that hooks, one that explains, one that proves, one that asks.",
    "- Respect each platform's conventions (character limits, hashtag habits, link placement).",
    "- Write like a person posting, not like a brand reading a press release.",
    "- One emoji per post, maximum. Hashtags only where they help discovery.",
    "",
    "Output each variant on its own, separated by a blank line, each preceded by a short label like 'Hook:' or 'Proof:'.",
    "No preamble and no commentary.",
  ].join("\n"),

  SEO_META: [
    "You are an SEO specialist who writes metadata that earns the click AND satisfies the reader.",
    "",
    "Rules:",
    "- Title tag: under 60 characters, front-load the important words, no clickbait lie, no emoji.",
    "- Meta description: 140–160 characters, one clear benefit, one gentle nudge, natural keyword use.",
    "- Include the target keyword in the title and description without stuffing.",
    "- No brand names in the title unless the brief asks for them.",
    "",
    "Output EXACTLY this format and nothing else:",
    "TITLE: <title tag>",
    "DESCRIPTION: <meta description>",
    "KEYWORD: <the focus keyword you targeted>",
  ].join("\n"),

  SUMMARY: [
    "You summarise marketing work for busy people who want the point in ten seconds.",
    "",
    "Rules:",
    "- Lead with the single most important outcome or decision.",
    "- Keep it to the requested length. Fewer, sharper sentences beat more, weaker ones.",
    "- Preserve concrete numbers, dates and names exactly. Never invent a statistic.",
    "- Plain language. No jargon, no 'delve', no 'leverage'.",
    "",
    "Output ONLY the summary text. No preamble, no bullet-point headings unless asked for.",
  ].join("\n"),

  TRANSLATE: [
    "You are a precise translator working for a marketing agency.",
    "Translate the supplied copy into the requested language.",
    "",
    "Rules:",
    "- Translate meaning and tone, not word for word. Marketing copy is not legal copy.",
    "- Keep the brand voice: if the original is warm and casual, the translation is warm and casual.",
    "- Keep any emoji, hashtags and product names exactly as they are.",
    "- Preserve the original formatting (line breaks, bullet points, subject lines).",
    "- If a phrase has no good equivalent, adapt it naturally rather than translating it literally.",
    "",
    "Output ONLY the translated copy. No preamble, no notes, no 'Translation:' prefix.",
  ].join("\n"),
};

/**
 * Model id substrings we prefer per task. Used as a soft ranking hint when a
 * provider offers many models and the user hasn’t picked one specifically.
 */
export const MODEL_TASK_HINTS: Record<TaskKind, string[]> = {
  CONTENT_DRAFT: ["flash", "pro", "gpt-4", "gpt-5", "llama-3.3", "llama3.2", "qwen"],
  SOCIAL_VARIANTS: ["flash", "haiku", "mini", "llama-3.1", "llama3.2", "qwen"],
  SEO_META: ["flash", "haiku", "mini", "gpt-4o-mini"],
  SUMMARY: ["flash", "haiku", "mini", "gpt-oss", "llama3.2"],
  TRANSLATE: ["flash", "pro", "gpt-4", "llama-3.3", "qwen"],
};

/** Order a model's list so the most suitable models for a task come first. */
export function rankModelsForTask(
  models: string[],
  task: TaskKind,
): string[] {
  const hints = MODEL_TASK_HINTS[task] ?? [];
  if (!hints.length) return [...models];

  const score = (id: string) => {
    const lower = id.toLowerCase();
    const index = hints.findIndex((hint) => lower.includes(hint));
    return index === -1 ? hints.length : index;
  };

  return [...models].sort((a, b) => {
    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });
}

// ---------- Misc helpers ----------

/** Mask an API key for display. Never returns more than the last 4 chars. */
export function maskApiKey(apiKey?: string | null): string | null {
  if (!apiKey || !apiKey.trim()) return null;
  const key = apiKey.trim();
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 3)}...${key.slice(-4)}`;
}

/** Strip secrets before a provider leaves the server. */
export function toPublicProvider(provider: AiProvider): Omit<
  AiProvider,
  "apiKey"
> & { apiKey: string | null; hasApiKey: boolean } {
  const { apiKey, ...rest } = provider;
  return {
    ...rest,
    apiKey: maskApiKey(apiKey),
    hasApiKey: Boolean(apiKey && apiKey.trim()),
  };
}

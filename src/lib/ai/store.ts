import type { AiProvider } from "@/lib/types";
import { PROVIDER_PRESETS, toPublicProvider } from "./providers";

/**
 * Server-side provider store.
 *
 * In-memory for now (module-level Map), tenant-scoped to the demo agency.
 * API keys live here and are NEVER returned raw to the client — the GET
 * route masks them.
 *
 * Swapping this for Prisma later means replacing the bodies below without
 * touching any caller, exactly like src/lib/data.ts.
 */

export const DEMO_AGENCY_ID = "agy_demo";

interface StoredProvider {
  provider: AiProvider;
  /** Kept apart from the provider so it can never leak by accident. */
  apiKey?: string | null;
}

const providers = new Map<string, StoredProvider>();

function seedProviders() {
  if (providers.size > 0) return;

  const now = new Date();

  PROVIDER_PRESETS.filter((preset) => preset.id !== "custom").forEach(
    (preset, index) => {
      const id = `prv_${preset.id}`;
      providers.set(id, {
        provider: {
          id,
          agencyId: DEMO_AGENCY_ID,
          label: preset.label,
          kind: preset.kind,
          baseUrl: preset.baseUrl,
          apiKey: null,
          models: [...preset.defaultModels],
          isDefault: index === 0,
          createdAt: now,
        },
        apiKey: null,
      });
    },
  );
}

seedProviders();

function newProviderId(): string {
  return `prv_${Math.random().toString(36).slice(2, 9)}`;
}

export interface ProviderInput {
  label: string;
  baseUrl: string;
  apiKey?: string | null;
  kind: AiProvider["kind"];
  models?: string[];
  isDefault?: boolean;
}

/** Create a provider. The first one added becomes the default. */
export function createProvider(input: ProviderInput): AiProvider {
  const id = newProviderId();
  const isFirst = providers.size === 0;

  if (input.isDefault) {
    for (const entry of providers.values()) {
      entry.provider.isDefault = false;
    }
  }

  const provider: AiProvider = {
    id,
    agencyId: DEMO_AGENCY_ID,
    label: input.label.trim() || "Untitled provider",
    kind: input.kind,
    baseUrl: input.baseUrl.trim(),
    apiKey: input.apiKey?.trim() || null,
    models: input.models ?? [],
    isDefault: input.isDefault ?? isFirst,
    createdAt: new Date(),
  };

  providers.set(id, { provider, apiKey: provider.apiKey });
  return provider;
}

export function listProviders(): AiProvider[] {
  return [...providers.values()]
    .map((entry) => entry.provider)
    .sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
}

/** The provider plus its raw API key. Server-side use only. */
export function getProviderWithKey(
  id: string,
): { provider: AiProvider; apiKey: string | null } | null {
  const entry = providers.get(id);
  if (!entry) return null;
  return { provider: entry.provider, apiKey: entry.apiKey ?? null };
}

export function getProvider(id: string): AiProvider | null {
  return providers.get(id)?.provider ?? null;
}

/** The provider generation should use: the requested one, else the default. */
export function getDefaultProvider(): AiProvider | null {
  const all = listProviders();
  return all.find((p) => p.isDefault) ?? all[0] ?? null;
}

export function updateProvider(
  id: string,
  patch: Partial<
    Pick<
      AiProvider,
      "label" | "baseUrl" | "kind" | "models" | "isDefault" | "apiKey"
    >
  >,
): AiProvider | null {
  const entry = providers.get(id);
  if (!entry) return null;

  if (patch.isDefault) {
    for (const other of providers.values()) {
      other.provider.isDefault = false;
    }
  }

  if (patch.label !== undefined) entry.provider.label = patch.label.trim();
  if (patch.baseUrl !== undefined) entry.provider.baseUrl = patch.baseUrl.trim();
  if (patch.kind !== undefined) entry.provider.kind = patch.kind;
  if (patch.models !== undefined) entry.provider.models = [...patch.models];
  if (patch.isDefault !== undefined) entry.provider.isDefault = patch.isDefault;

  if (patch.apiKey !== undefined) {
    const next = patch.apiKey?.trim() || null;
    entry.provider.apiKey = next;
    entry.apiKey = next;
  }

  return entry.provider;
}

export function deleteProvider(id: string): boolean {
  const deleted = providers.delete(id);
  if (deleted && !listProviders().some((p) => p.isDefault)) {
    const next = listProviders()[0];
    if (next) next.isDefault = true;
  }
  return deleted;
}

/** Masking helper re-exported so routes have one import for it. */
export { maskApiKey, toPublicProvider } from "./providers";

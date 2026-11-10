"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Server,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/components/ui";
import { PROVIDER_PRESETS } from "@/lib/ai/providers";
import type { AiModel, ProviderKind } from "@/lib/types";
import type { PublicProvider } from "./types";
import { cn } from "@/lib/utils";

/**
 * AI provider manager.
 *
 * The core flow the product owner asked for:
 *   1. paste a base URL (+ API key)
 *   2. hit "Fetch models", we ask THAT endpoint what it supports
 *   3. tick the models you want
 *   4. save, it becomes a first-class provider you can draft with
 *
 * Deliberately reusable: it lives here so both /content-studio and
 * /settings/providers can show it.
 */

export interface ProviderManagerProps {
  className?: string;
  /** Called after a provider is added/changed, so the parent can refresh. */
  onProvidersChanged?: () => void;
}

const KIND_OPTIONS: { value: ProviderKind; label: string }[] = [
  { value: "OPENAI_COMPATIBLE", label: "OpenAI-compatible" },
  { value: "OLLAMA", label: "Ollama (local)" },
  { value: "ANTHROPIC", label: "Anthropic" },
];

export function ProviderManager({
  className,
  onProvidersChanged,
}: ProviderManagerProps) {
  const [providers, setProviders] = React.useState<PublicProvider[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  // New-provider form
  const [label, setLabel] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("");
  const [apiKey, setApiKey] = React.useState("");
  const [kind, setKind] = React.useState<ProviderKind>("OPENAI_COMPATIBLE");
  const [notes, setNotes] = React.useState<string | null>(null);

  // Discovery
  const [fetching, setFetching] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [discovered, setDiscovered] = React.useState<AiModel[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);

  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await fetch("/api/ai/providers", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setLoadError(data?.error ?? "Couldn't load your providers.");
        return;
      }
      setProviders(data.providers ?? []);
    } catch {
      setLoadError("Couldn't reach the server. Is the app still running?");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const applyPreset = React.useCallback((presetId: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setLabel(preset.label);
    setBaseUrl(preset.baseUrl);
    setKind(preset.kind);
    setApiKey("");
    setNotes(preset.notes);
    setDiscovered([]);
    setSelected([...preset.defaultModels]);
    setFetchError(null);
    setSaveError(null);
    setSaved(false);
  }, []);

  const handleFetchModels = React.useCallback(async () => {
    if (!baseUrl.trim()) {
      setFetchError("Add the endpoint's base URL first.");
      return;
    }
    setFetching(true);
    setFetchError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: baseUrl.trim(), apiKey, kind }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setDiscovered([]);
        setFetchError(data?.error ?? "We couldn’t reach that endpoint.");
        return;
      }

      const models: AiModel[] = Array.isArray(data.models) ? data.models : [];
      setDiscovered(models);
      // Keep any already-ticked models that this endpoint actually offers;
      // otherwise start with the first few so it’s a one-tap save.
      setSelected((prev) => {
        const ids = new Set(models.map((m) => m.id));
        const keep = prev.filter((id) => ids.has(id));
        return keep.length ? keep : models.slice(0, 3).map((m) => m.id);
      });
    } catch {
      setFetchError("Couldn't reach our own server. Is the app still running?");
    } finally {
      setFetching(false);
    }
  }, [apiKey, baseUrl, kind]);

  const toggleModel = React.useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!label.trim()) {
      setSaveError("Give the provider a name first.");
      return;
    }
    if (!baseUrl.trim()) {
      setSaveError("Add the base URL first.");
      return;
    }
    if (!selected.length) {
      setSaveError("Pick at least one model.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/ai/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim() || undefined,
          kind,
          models: selected,
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setSaveError(data?.error ?? "Couldn't save that provider.");
        return;
      }

      setSaved(true);
      setApiKey("");
      setDiscovered([]);
      setSelected([]);
      setLabel("");
      setBaseUrl("");
      setNotes(null);
      await load();
      onProvidersChanged?.();
    } catch {
      setSaveError("Couldn't reach our own server. Is the app still running?");
    } finally {
      setSaving(false);
    }
  }, [apiKey, baseUrl, kind, label, load, onProvidersChanged, selected]);

  const handleRemove = React.useCallback(
    async (id: string) => {
      try {
        await fetch("/api/ai/providers", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      } catch {
        /* the list refresh below is what matters */
      }
      await load();
      onProvidersChanged?.();
    },
    [load, onProvidersChanged],
  );

  return (
    <div className={cn("space-y-5", className)}>
      {/* ---------- Presets ---------- */}
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-paper-3" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-lilac" aria-hidden />
            Start from a preset
          </CardTitle>
          <CardDescription>
            The free tiers that actually exist, ready to go. Pick one and we&apos;ll
            fill in the details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  "group rounded-card border border-rule bg-paper-2 p-4 text-left",
                  "transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-card",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                )}
              >
                <p className="font-display text-sm font-bold text-ink">
                  {preset.label}
                </p>
                <p className="mt-1 truncate font-mono text-[11px] text-muted">
                  {preset.baseUrl || "your own endpoint"}
                </p>
                {preset.defaultModels.length > 0 && (
                  <p className="mt-2 text-[11px] text-ink-2">
                    {preset.defaultModels.length} default model
                    {preset.defaultModels.length === 1 ? "" : "s"}
                  </p>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ---------- Add provider ---------- */}
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-paper-3" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-mint" aria-hidden />
            Add an endpoint
          </CardTitle>
          <CardDescription>
            Any OpenAI-compatible API. We&apos;ll ask it what models it has, you
            pick which ones to keep.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes && (
            <p className="rounded-control bg-paper-3 px-3.5 py-2.5 text-xs leading-relaxed text-ink">
              {notes}
            </p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="provider-label">Name</Label>
              <Input
                id="provider-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Our vLLM box"
                autoComplete="off"
              />
            </div>

            <div>
              <Label htmlFor="provider-kind">Type</Label>
              <select
                id="provider-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as ProviderKind)}
                className={cn(
                  "h-10 w-full rounded-control border border-rule bg-paper-2 px-3.5 text-sm",
                  "text-ink transition-colors focus:border-accent focus:outline-none",
                  "focus:ring-4 focus:ring-accent/15",
                )}
              >
                {KIND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="provider-base-url">Base URL</Label>
              <Input
                id="provider-base-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com/v1"
                autoComplete="off"
                spellCheck={false}
                className="font-mono text-xs"
              />
              <p className="mt-1.5 text-[11px] text-muted">
                The API root, not the full path. We&apos;ll append{" "}
                <code className="font-mono">/models</code> and{" "}
                <code className="font-mono">/chat/completions</code> ourselves.
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="provider-api-key" className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" aria-hidden />
                API key
                <span className="font-normal text-muted">
                  (leave blank for local models)
                </span>
              </Label>
              <Input
                id="provider-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                autoComplete="off"
                spellCheck={false}
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Stored on the server only. We never send it back to the browser, not even masked.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="sky"
              onClick={handleFetchModels}
              disabled={fetching}
            >
              {fetching ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              {fetching ? "Fetching models…" : "Fetch models"}
            </Button>

            <Button
              type="button"
              variant="mint"
              onClick={handleSave}
              disabled={saving || !selected.length}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Check className="h-4 w-4" aria-hidden />
              )}
              {saving ? "Saving…" : "Save provider"}
            </Button>

            {saved && (
              <Badge tone="mint" className="animate-rise">
                <Check className="h-3 w-3" aria-hidden />
                Saved!
              </Badge>
            )}
          </div>

          {fetchError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-control bg-paper-3 px-3.5 py-2.5 text-xs leading-relaxed text-ink"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {fetchError}
            </p>
          )}

          {saveError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-control bg-paper-3 px-3.5 py-2.5 text-xs leading-relaxed text-ink"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {saveError}
            </p>
          )}

          {discovered.length > 0 && (
            <div className="animate-rise rounded-card border border-rule bg-paper-3/60 p-4">
              <p className="text-xs font-bold text-ink">
                Found {discovered.length} model
                {discovered.length === 1 ? "" : "s"}, tick the ones you want
              </p>
              <ul className="mt-3 max-h-64 space-y-1.5 overflow-y-auto pr-1">
                {discovered.map((model) => {
                  const isOn = selected.includes(model.id);
                  return (
                    <li key={model.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-control px-2 py-1.5 transition-colors hover:bg-paper-2">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggleModel(model.id)}
                          className="h-4 w-4 shrink-0 rounded border-rule accent-[var(--mint)]"
                        />
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
                          {model.id}
                        </span>
                        {model.contextLength ? (
                          <Badge tone="neutral" className="shrink-0 text-[10px]">
                            {Math.round(model.contextLength / 1000)}k ctx
                          </Badge>
                        ) : null}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] text-muted">
                {selected.length} selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Configured providers ---------- */}
      <Card className="overflow-hidden">
        <div className="h-1.5 w-full bg-accent" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-4 w-4 text-peach" aria-hidden />
            Your providers
          </CardTitle>
          <CardDescription>
            The endpoints Brightside can write with.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-control bg-paper-3"
                />
              ))}
            </div>
          ) : loadError ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-control bg-paper-3 px-3.5 py-2.5 text-xs text-ink"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {loadError}
            </p>
          ) : providers.length === 0 ? (
            <p className="rounded-card border border-dashed border-rule bg-paper-3/50 px-4 py-8 text-center text-sm text-ink-2">
              No providers yet. Pick a preset above and we&apos;ll wire one up.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {providers.map((provider) => (
                <li
                  key={provider.id}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-rule bg-paper-2 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-bold text-ink">
                        {provider.label}
                      </p>
                      {provider.isDefault && (
                        <Badge tone="mint">
                          <Zap className="h-3 w-3" aria-hidden />
                          Default
                        </Badge>
                      )}
                      {provider.hasApiKey && (
                        <Badge tone="lilac">
                          <KeyRound className="h-3 w-3" aria-hidden />
                          Keyed
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 truncate font-mono text-[11px] text-muted">
                      {provider.baseUrl}
                    </p>
                    <p className="mt-1.5 text-[11px] text-ink-2">
                      {provider.models.length
                        ? provider.models.join(" · ")
                        : "No models picked yet"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(provider.id)}
                    aria-label={`Remove ${provider.label}`}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Small helper so the content studio can show a compact provider picker. */
export function ProviderPicker({
  providers,
  value,
  onChange,
  id,
}: {
  providers: PublicProvider[];
  value: string;
  onChange: (id: string) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-10 w-full rounded-control border border-rule bg-paper-2 px-3.5 text-sm",
        "text-ink transition-colors focus:border-accent focus:outline-none",
        "focus:ring-4 focus:ring-accent/15",
      )}
    >
      {providers.length === 0 && <option value="">No providers yet</option>}
      {providers.map((provider) => (
        <option key={provider.id} value={provider.id}>
          {provider.label}
          {provider.isDefault ? " (default)" : ""}
        </option>
      ))}
    </select>
  );
}

"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Eye,
  Loader2,
  PenLine,
  Save,
  Send,
  Sparkles,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { RelativeTime } from "./relative-time";
import { ProviderManager } from "./provider-manager";
import { editContentAction, saveContentAction } from "./actions";
import type {
  StudioCampaign,
  StudioClient,
  StudioContent,
  StudioProvider,
} from "./types";
import {
  CHANNEL_LABELS,
  CHANNELS,
  CONTENT_STATUS_LABELS,
  CONTENT_STATUSES,
  type Channel,
  type ContentStatus,
  type TaskKind,
} from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------- Config ----------

const CHANNEL_ICON: Record<Channel, string> = {
  SOCIAL: "campaign",
  EMAIL: "email",
  SEO: "search",
  SEM: "goal",
  BLOG: "document",
};

const STATUS_TONE: Record<ContentStatus, "neutral" | "mint" | "peach" | "sky" | "butter" | "lilac" | "success"> = {
  IDEA: "neutral",
  DRAFTING: "butter",
  DRAFT: "sky",
  IN_REVIEW: "peach",
  APPROVED: "mint",
  SCHEDULED: "lilac",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

const CHANNEL_TONE: Record<Channel, "mint" | "peach" | "sky" | "butter" | "lilac"> = {
  SOCIAL: "mint",
  EMAIL: "peach",
  SEO: "sky",
  SEM: "butter",
  BLOG: "lilac",
};

/** The order a draft walks through, once it’s in the pipeline. */
const WORKFLOW: ContentStatus[] = [
  "DRAFT",
  "IN_REVIEW",
  "APPROVED",
  "SCHEDULED",
];

const THINKING_LINES = [
  "Pondering the brief…",
  "Finding the right words…",
  "Channeling the brand voice…",
  "Almost there, one more coffee…",
];

const BRIEF_PLACEHOLDERS: Record<Channel, string> = {
  SOCIAL:
    "Launch our oat-hydrate serum. Audience: 25-40, skincare-curious, allergic to hype. Tone: warm, a bit nerdy, no emoji spam.",
  EMAIL:
    "Second email in our holiday gift guide series. Promote the bold single-origin blend. Aim for 42% open rate like last year.",
  SEO:
    "Write a 600-word guide on what 'clean beauty' actually means on an ingredient label. Target keyword: clean beauty ingredients.",
  SEM:
    "Search ad copy for 'sustainable gift set'. Three headlines under 30 characters, two descriptions under 90.",
  BLOG:
    "Portfolio piece for a coastal villa project, architecture studio, warm minimal, afternoon light. 400 words.",
};

interface ContentStudioProps {
  clients: StudioClient[];
  campaigns: StudioCampaign[];
  initialContent: StudioContent[];
  initialProviders: StudioProvider[];
}

// ---------- Component ----------

export function ContentStudio({
  clients,
  campaigns,
  initialContent,
  initialProviders,
}: ContentStudioProps) {
  const [content, setContent] = React.useState<StudioContent[]>(initialContent);
  const [providers, setProviders] = React.useState<StudioProvider[]>(
    initialProviders,
  );

  const [tab, setTab] = React.useState<"studio" | "providers">("studio");

  // Filters
  const [clientFilter, setClientFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<ContentStatus | "all">(
    "all",
  );
  const [channelFilter, setChannelFilter] = React.useState<Channel | "all">(
    "all",
  );

  // Composer
  const [clientId, setClientId] = React.useState(clients[0]?.id ?? "");
  const [channel, setChannel] = React.useState<Channel>("SOCIAL");
  const [campaignId, setCampaignId] = React.useState<string>("");
  const [brief, setBrief] = React.useState("");
  const [providerId, setProviderId] = React.useState(
    initialProviders[0]?.id ?? "",
  );
  const [model, setModel] = React.useState("");
  const [task, setTask] = React.useState<TaskKind>("CONTENT_DRAFT");

  // Generation
  const [generating, setGenerating] = React.useState(false);
  const [thinkingIndex, setThinkingIndex] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  // Draft under edit
  const [draft, setDraft] = React.useState<{
    title: string;
    body: string;
    model: string;
  } | null>(null);
  const [draftTitle, setDraftTitle] = React.useState("");
  const [draftBody, setDraftBody] = React.useState("");
  const [savingDraft, setSavingDraft] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  // Editor panel
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editBody, setEditBody] = React.useState("");
  const [savingEdit, setSavingEdit] = React.useState(false);

  const clientCampaigns = React.useMemo(
    () => campaigns.filter((c) => c.clientId === clientId),
    [campaigns, clientId],
  );

  const activeProvider = React.useMemo(
    () => providers.find((p) => p.id === providerId) ?? providers[0] ?? null,
    [providerId, providers],
  );

  // Keep the model selection valid when the provider changes.
  React.useEffect(() => {
    if (!activeProvider) {
      setModel("");
      return;
    }
    setModel((prev) =>
      activeProvider.models.includes(prev)
        ? prev
        : (activeProvider.models[0] ?? ""),
    );
  }, [activeProvider]);

  // Reset campaign when the client changes.
  React.useEffect(() => {
    setCampaignId((prev) =>
      clientCampaigns.some((c) => c.id === prev) ? prev : "",
    );
  }, [clientCampaigns]);

  // Cycle the "thinking" copy while we wait.
  React.useEffect(() => {
    if (!generating) return;
    const timer = setInterval(
      () => setThinkingIndex((i) => (i + 1) % THINKING_LINES.length),
      1800,
    );
    return () => clearInterval(timer);
  }, [generating]);

  // Auto-dismiss the toast.
  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const filtered = React.useMemo(() => {
    return content.filter((item) => {
      if (clientFilter !== "all" && item.clientId !== clientFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (channelFilter !== "all" && item.channel !== channelFilter) return false;
      return true;
    });
  }, [channelFilter, clientFilter, content, statusFilter]);

  const clientName = React.useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client",
    [clients],
  );

  // ---------- Actions ----------

  const loadProviders = React.useCallback(async () => {
    try {
      const res = await fetch("/api/ai/providers", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setProviders(data.providers ?? []);
      }
    } catch {
      /* keep whatever we have */
    }
  }, []);

  // Refresh the provider list on mount. This page prerenders statically, so the
  // server-rendered providers are a build-time snapshot, without this, a
  // provider added at runtime never reaches the composer's dropdown.
  React.useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const handleGenerate = React.useCallback(async () => {
    if (!brief.trim()) {
      setError("Give the brief something to work with first.");
      return;
    }
    if (!activeProvider) {
      setError(
        "No AI provider is set up yet. Add one in the AI Providers tab and we’ll get drafting.",
      );
      setTab("providers");
      return;
    }

    setGenerating(true);
    setError(null);
    setThinkingIndex(0);
    setDraft(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: activeProvider.id,
          model: model || undefined,
          task,
          prompt: brief.trim(),
        }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went sideways. Try again in a moment.");
        return;
      }

      const result = data.result;
      const suggestedTitle =
        brief.trim().split(/\s+/).slice(0, 8).join(" ").replace(/[.!?,]+$/, "") ||
        "Untitled draft";

      setDraft({
        title: suggestedTitle,
        body: result.text ?? "",
        model: result.model ?? model,
      });
      setDraftTitle(suggestedTitle);
      setDraftBody(result.text ?? "");
      setToast(
        `Draft ready in ${(result.latencyMs / 1000).toFixed(1)}s${
          result.tokensUsed ? ` · ${result.tokensUsed} tokens` : ""
        }`,
      );
    } catch {
      setError("Couldn't reach our own server. Is the app still running?");
    } finally {
      setGenerating(false);
    }
  }, [activeProvider, brief, model, task]);

  const handleSaveDraft = React.useCallback(
    async (status: "DRAFT" | "IN_REVIEW") => {
      if (!draft) return;
      if (!clientId) {
        setError("Pick a client for this draft first.");
        return;
      }

      setSavingDraft(true);
      setError(null);

      try {
        const result = await saveContentAction({
          clientId,
          campaignId: campaignId || null,
          title: draftTitle.trim() || "Untitled draft",
          body: draftBody,
          channel,
          status,
          generatedBy: draft.model,
        });

        if (!result.ok) {
          setError(result.error);
          return;
        }

        setContent((prev) => [result.content, ...prev]);
        setDraft(null);
        setDraftBody("");
        setDraftTitle("");
        setToast(
          status === "IN_REVIEW"
            ? "Sent for review, the client's in the loop now."
            : "Draft saved. Nice work.",
        );
      } catch {
        setError("Couldn't reach our own server. Is the app still running?");
      } finally {
        setSavingDraft(false);
      }
    },
    [campaignId, channel, clientId, draft, draftBody, draftTitle],
  );

  const handleDiscard = React.useCallback(() => {
    setDraft(null);
    setDraftBody("");
    setDraftTitle("");
    setError(null);
  }, []);

  const openEditor = React.useCallback((item: StudioContent) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
  }, []);

  const handleSaveEdit = React.useCallback(
    async (status?: ContentStatus) => {
      if (!editingId) return;
      setSavingEdit(true);
      try {
        const result = await editContentAction({
          id: editingId,
          title: editTitle,
          body: editBody,
          status,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setContent((prev) =>
          prev.map((c) => (c.id === editingId ? result.content : c)),
        );
        setEditingId(null);
        setToast("Saved.");
      } catch {
        setError("Couldn't reach our own server. Is the app still running?");
      } finally {
        setSavingEdit(false);
      }
    },
    [editBody, editTitle, editingId],
  );

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* ---------- Header ---------- */}
      <header className="animate-rise">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold text-ink">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent">
                <PenLine className="h-4 w-4 text-accent-ink" aria-hidden="true" />
              </span>
              Content Studio
            </h1>
            <p className="mt-1.5 text-sm text-ink-2">
              Brief it, draft it, ship it, without the blank-page panic.
            </p>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Content Studio sections"
            className="flex rounded-control border border-rule bg-paper-3 p-1"
          >
            {(
              [
                { id: "studio", label: "Studio", icon: "content" },
                { id: "providers", label: "⚡ AI Providers", icon: "speed" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                role="tab"
                type="button"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "rounded-control px-3.5 py-2 text-sm font-bold transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  tab === item.id
                    ? "bg-paper-2 text-ink shadow-card"
                    : "text-ink-2 hover:text-ink",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {tab === "providers" ? (
        <div className="animate-rise">
          <ProviderManager onProvidersChanged={loadProviders} />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {/* ---------- Composer ---------- */}
          <div className="space-y-5">
            <Card className="overflow-hidden xl:sticky xl:top-6">
              <div className="h-1.5 w-full bg-paper-3" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-mint" aria-hidden />
                  New content
                </CardTitle>
                <CardDescription>
                  Fill in the bits you know. We&apos;ll handle the blank page.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="studio-client">Client</Label>
                  <select
                    id="studio-client"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className={cn(
                      "h-10 w-full rounded-control border border-rule bg-paper-2 px-3.5 text-sm",
                      "text-ink transition-colors focus:border-accent focus:outline-none",
                      "focus:ring-4 focus:ring-accent/15",
                    )}
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="studio-channel">Channel</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CHANNELS.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setChannel(option)}
                        aria-pressed={channel === option}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-control border px-2 py-2",
                          "text-xs font-bold transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                          channel === option
                            ? "border-transparent bg-paper-2 text-ink shadow-card"
                            : "border-rule bg-paper-2 text-ink-2 hover:bg-paper-3 hover:text-ink",
                        )}
                      >
                        <span aria-hidden>{CHANNEL_ICON[option]}</span>
                        {CHANNEL_LABELS[option]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="studio-campaign">
                    Campaign{" "}
                    <span className="font-normal text-muted">(optional)</span>
                  </Label>
                  <select
                    id="studio-campaign"
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className={cn(
                      "h-10 w-full rounded-control border border-rule bg-paper-2 px-3.5 text-sm",
                      "text-ink transition-colors focus:border-accent focus:outline-none",
                      "focus:ring-4 focus:ring-accent/15",
                    )}
                  >
                    <option value="">No campaign, just a draft</option>
                    {clientCampaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="studio-provider">Model</Label>
                  {providers.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setTab("providers")}
                      className="w-full rounded-control border border-dashed border-rule bg-paper-3/60 px-3.5 py-3 text-left text-xs text-ink-2 transition-colors hover:bg-paper-3"
                    >
                      Add a provider
                    </button>
                  ) : (
                    <>
                      <select
                        id="studio-provider"
                        value={providerId}
                        onChange={(e) => setProviderId(e.target.value)}
                        className={cn(
                          "h-10 w-full rounded-control border border-rule bg-paper-2 px-3.5 text-sm",
                          "text-ink transition-colors focus:border-accent focus:outline-none",
                          "focus:ring-4 focus:ring-accent/15",
                        )}
                      >
                        {providers.map((provider) => (
                          <option key={provider.id} value={provider.id}>
                            {provider.label}
                          </option>
                        ))}
                      </select>

                      {activeProvider && activeProvider.models.length > 0 && (
                        <div className="mt-2">
                          <Label
                            htmlFor="studio-model"
                            className="text-[11px] font-bold"
                          >
                            Which model
                          </Label>                          <select
                            id="studio-model"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className={cn(
                              "h-10 w-full rounded-control border border-rule bg-paper-2 px-3.5 text-sm",
                              "text-ink transition-colors focus:border-accent focus:outline-none",
                              "focus:ring-4 focus:ring-accent/15",
                            )}
                          >
                            {activeProvider.models.map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <Label htmlFor="studio-task">What are we writing?</Label>
                  <select
                    id="studio-task"
                    value={task}
                    onChange={(e) => setTask(e.target.value as TaskKind)}
                    className={cn(
                      "h-10 w-full rounded-control border border-rule bg-paper-2 px-3.5 text-sm",
                      "text-ink transition-colors focus:border-accent focus:outline-none",
                      "focus:ring-4 focus:ring-accent/15",
                    )}
                  >
                    <option value="CONTENT_DRAFT">A full draft</option>
                    <option value="SOCIAL_VARIANTS">Social variants</option>
                    <option value="SEO_META">SEO title & meta</option>
                    <option value="SUMMARY">A summary</option>
                    <option value="TRANSLATE">A translation</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="studio-brief">The brief</Label>
                  <Textarea
                    id="studio-brief"
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    rows={6}
                    placeholder={BRIEF_PLACEHOLDERS[channel]}
                  />
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <WandSparkles className="h-4 w-4" aria-hidden />
                  )}
                  {generating ? THINKING_LINES[thinkingIndex] : "Draft it"}
                </Button>

                {error && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 rounded-control bg-paper-3 px-3.5 py-2.5 text-xs leading-relaxed text-ink"
                  >
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {error}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ---------- Board ---------- */}
          <div className="space-y-5">
            {/* Filters */}
            <Card className="animate-rise">
              <CardContent className="space-y-4 pt-5">
                <div className="flex flex-wrap gap-3">
                  <div className="min-w-[180px] flex-1">
                    <Label htmlFor="filter-client" className="text-[11px]">
                      Filter by client
                    </Label>
                    <select
                      id="filter-client"
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className={cn(
                        "h-9 w-full rounded-control border border-rule bg-paper-2 px-3 text-sm",
                        "text-ink transition-colors focus:border-accent focus:outline-none",
                        "focus:ring-4 focus:ring-accent/15",
                      )}
                    >
                      <option value="all">All clients</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-[160px] flex-1">
                    <Label htmlFor="filter-channel" className="text-[11px]">
                      Filter by channel
                    </Label>
                    <select
                      id="filter-channel"
                      value={channelFilter}
                      onChange={(e) =>
                        setChannelFilter(e.target.value as Channel | "all")
                      }
                      className={cn(
                        "h-9 w-full rounded-control border border-rule bg-paper-2 px-3 text-sm",
                        "text-ink transition-colors focus:border-accent focus:outline-none",
                        "focus:ring-4 focus:ring-accent/15",
                      )}
                    >
                      <option value="all">All channels</option>
                      {CHANNELS.map((option) => (
                        <option key={option} value={option}>
                          {CHANNEL_LABELS[option]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status chips */}
                <div
                  role="group"
                  aria-label="Filter by status"
                  className="flex flex-wrap gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    aria-pressed={statusFilter === "all"}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-bold transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                      statusFilter === "all"
                        ? "bg-ink text-paper"
                        : "bg-paper-3 text-ink-2 hover:bg-paper-2 hover:text-ink",
                    )}
                  >
                    Everything
                  </button>
                  {CONTENT_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setStatusFilter(
                          statusFilter === status ? "all" : status,
                        )
                      }
                      aria-pressed={statusFilter === status}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-bold transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                        statusFilter === status
                          ? "bg-paper-2 text-ink ring-1 ring-lilac"
                          : "bg-paper-3 text-ink-2 hover:bg-paper-2 hover:text-ink",
                      )}
                    >
                      {CONTENT_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* List */}
            {filtered.length === 0 ? (
              <EmptyState
                icon={content.length === 0 ? "new" : "search"}
                title={
                  content.length === 0
                    ? "Nothing here yet, let's make something people brag about"
                    : "No drafts match those filters"
                }
                description={
                  content.length === 0
                    ? "Your first draft is one brief away. Pick a client on the left and tell us what you’re making."
                    : "Try loosening a filter or two. The content's still there, promise."
                }
                action={
                  content.length === 0 ? (
                    <Button
                      type="button"
                      variant="mint"
                      onClick={() =>
                        document
                          .getElementById("studio-brief")
                          ?.scrollIntoView({ behavior: "smooth", block: "center" })
                      }
                    >
                      <Sparkles className="h-4 w-4" aria-hidden />
                      Write the first one
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setClientFilter("all");
                        setStatusFilter("all");
                        setChannelFilter("all");
                      }}
                    >
                      Clear filters
                    </Button>
                  )
                }
              />
            ) : (
              <ul className="space-y-3">
                {filtered.map((item, index) => (
                  <li
                    key={item.id}
                    className="animate-rise"
                    style={{ animationDelay: `${Math.min(index * 40, 320)}ms` }}
                  >
                    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-card">
                      <div
                        className={cn(
                          "h-1 w-full",
                          item.channel === "SOCIAL" && "bg-paper-3",
                          item.channel === "EMAIL" && "bg-accent",
                          item.channel === "SEO" && "bg-paper-2",
                          item.channel === "SEM" && "bg-paper-3",
                          item.channel === "BLOG" && "bg-paper-3",
                        )}
                      />
                      <CardContent className="pt-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-display text-base font-bold text-ink">
                              {item.title}
                            </h3>
                            <p className="mt-1 text-xs text-ink-2">
                              {clientName(item.clientId)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge tone={CHANNEL_TONE[item.channel]}>
                              <span aria-hidden>
                                {CHANNEL_ICON[item.channel]}
                              </span>
                              {CHANNEL_LABELS[item.channel]}
                            </Badge>
                            <Badge tone={STATUS_TONE[item.status]}>
                              {CONTENT_STATUS_LABELS[item.status]}
                            </Badge>
                          </div>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-ink-2">
                          {item.body}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {item.generatedBy && (
                            <Badge tone="lilac" className="font-mono text-[10px]">
                              <Sparkles className="h-3 w-3" aria-hidden />
                              {item.generatedBy}
                            </Badge>
                          )}
                          <RelativeTime
                            value={item.updatedAt}
                            className="text-[11px] text-muted"
                          />

                          <div className="ml-auto flex items-center gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditor(item)}
                            >
                              <PenLine className="h-3.5 w-3.5" aria-hidden />
                              Edit
                            </Button>
                          </div>
                        </div>

                        {editingId === item.id && (
                          <div className="mt-4 animate-rise space-y-3 rounded-card border border-rule bg-paper-3/60 p-4">
                            <div>
                              <Label htmlFor={`edit-title-${item.id}`}>
                                Title
                              </Label>
                              <Input
                                id={`edit-title-${item.id}`}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edit-body-${item.id}`}>Body</Label>
                              <Textarea
                                id={`edit-body-${item.id}`}
                                value={editBody}
                                onChange={(e) => setEditBody(e.target.value)}
                                rows={8}
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                type="button"
                                variant="mint"
                                size="sm"
                                onClick={() => handleSaveEdit()}
                                disabled={savingEdit}
                              >
                                {savingEdit ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                ) : (
                                  <Save className="h-3.5 w-3.5" aria-hidden />
                                )}
                                Save changes
                              </Button>

                              {WORKFLOW.map((status) => (
                                <Button
                                  key={status}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSaveEdit(status)}
                                  disabled={savingEdit}
                                  aria-label={`Move this draft to ${CONTENT_STATUS_LABELS[status]}`}
                                >
                                  {status === "IN_REVIEW" ? (
                                    <Send className="h-3.5 w-3.5" aria-hidden />
                                  ) : status === "SCHEDULED" ? (
                                    <Eye className="h-3.5 w-3.5" aria-hidden />
                                  ) : null}
                                  {CONTENT_STATUS_LABELS[status]}
                                </Button>
                              ))}

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-3.5 w-3.5" aria-hidden />
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ---------- Generated draft panel ---------- */}
      {draft && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-paper-3/95 p-0 sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-dialog-title"
            className="animate-rise max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-rule bg-paper-2 shadow-card sm:rounded-card"
          >
            <div className="flex items-start justify-between gap-4 border-b border-rule p-5">
              <div>
                <h2
                  id="draft-dialog-title"
                  className="flex items-center gap-2 font-display text-lg font-bold text-ink"
                >
                  <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
                  Fresh draft
                </h2>
                <p className="mt-0.5 text-xs text-ink-2">
                  Made by{" "}
                  <span className="font-mono text-ink">{draft.model}</span>, make
                  it yours.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDiscard}
                aria-label="Close draft"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <Label htmlFor="draft-title">Title</Label>
                <Input
                  id="draft-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="draft-body">Copy</Label>
                <Textarea
                  id="draft-body"
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  rows={14}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-rule p-5">
              <Button
                type="button"
                variant="mint"
                onClick={() => handleSaveDraft("DRAFT")}
                disabled={savingDraft}
              >
                {savingDraft ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                Save draft
              </Button>
              <Button
                type="button"
                variant="peach"
                onClick={() => handleSaveDraft("IN_REVIEW")}
                disabled={savingDraft}
              >
                <Send className="h-4 w-4" aria-hidden />
                Send for review
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDiscard}
                disabled={savingDraft}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Discard
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(draftBody);
                  setToast("Copied to your clipboard.");
                }}
                className="ml-auto"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden />
                Copy text
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-rise fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-bold text-paper shadow-card">
            <Check className="h-4 w-4" aria-hidden />
            {toast}
          </div>
        </div>
      )}

      {/* ---------- Mobile filter hint ---------- */}
      <div className="flex items-center gap-1.5 text-[11px] text-muted xl:hidden">
        <ChevronDown className="h-3 w-3" aria-hidden />
        Filter the list above, it all works on one screen.
      </div>
    </div>
  );
}

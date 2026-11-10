"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Plus, Search, X } from "lucide-react";
import type { Client, ClientMetrics } from "@/lib/types";
import { CLIENT_STATUSES, CLIENT_STATUS_LABELS, type ClientStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, EmptyState, Input, Label } from "@/components/ui";
import { ClientCard } from "@/components/client-card";

/**
 * Roster shell: search, status chips, and the "add client" dialog.
 *
 * The data arrives as props from the server page; everything below is
 * client-side so filtering stays instant.
 */

const STATUS_TONES: Record<ClientStatus, string> = {
  ACTIVE: "bg-paper-2",
  ONBOARDING: "bg-paper-2",
  PAUSED: "bg-paper-3",
  CHURNED: "bg-paper-3",
};

export interface ClientRosterProps {
  clients: Client[];
  metrics: ClientMetrics[];
}

export function ClientRoster({ clients, metrics }: ClientRosterProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<ClientStatus | "ALL">("ALL");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [created, setCreated] = React.useState(false);

  const metricsById = React.useMemo(
    () => new Map(metrics.map((m) => [m.clientId, m])),
    [metrics],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((client) => {
      if (status !== "ALL" && client.status !== status) return false;
      if (!q) return true;
      return (
        client.name.toLowerCase().includes(q) ||
        (client.industry ?? "").toLowerCase().includes(q)
      );
    });
  }, [clients, query, status]);

  const counts = React.useMemo(() => {
    const map = new Map<ClientStatus | "ALL", number>();
    map.set("ALL", clients.length);
    for (const s of CLIENT_STATUSES) {
      map.set(s, clients.filter((c) => c.status === s).length);
    }
    return map;
  }, [clients]);

  function resetDialog() {
    setCreated(false);
    setSubmitting(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    // Mock persistence: the real write lands with the Prisma layer.
    await new Promise((resolve) => setTimeout(resolve, 650));
    setSubmitting(false);
    setCreated(true);
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      // Let the close animation finish before clearing the success state.
      window.setTimeout(resetDialog, 200);
    }
  }

  return (
    <div className="space-y-6">
      {/* ---------- Toolbar ---------- */}
      <div className="animate-rise flex flex-col gap-4 rounded-card bg-paper-2 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients or industries…"
            aria-label="Search clients by name or industry"
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filter by status"
          >
            <button
              type="button"
              onClick={() => setStatus("ALL")}
              aria-pressed={status === "ALL"}
              className={cn(
                "rounded-pill px-3 py-1.5 text-xs font-bold transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                status === "ALL"
                  ? "bg-ink text-paper"
                  : "bg-paper-3 text-ink-2 hover:bg-paper-2 hover:text-ink",
              )}
            >
              All ({counts.get("ALL")})
            </button>
            {CLIENT_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-xs font-bold transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  status === s
                    ? "bg-ink text-paper"
                    : cn(
                        "text-ink-2 hover:text-ink",
                        STATUS_TONES[s],
                        status !== s && "opacity-60 hover:opacity-100",
                      ),
                )}
              >
                {CLIENT_STATUS_LABELS[s]} ({counts.get(s) ?? 0})
              </button>
            ))}
          </div>

          <Dialog.Root open={dialogOpen} onOpenChange={handleOpenChange}>
            <Dialog.Trigger asChild>
              <Button variant="mint">
                <Plus className="h-4 w-4" aria-hidden />
                Add client
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-paper-3/95 data-[state=closed]:animate-[fade-out_150ms_ease-in] data-[state=open]:animate-[fade-in_150ms_ease-out]" />
              <Dialog.Content
                className={cn(
                  "fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
                  "rounded-card border border-rule bg-paper-2 p-6 shadow-card",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                )}
              >
                {created ? (
                  <div className="animate-rise flex flex-col items-center gap-3 py-4 text-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                      <Check className="h-7 w-7 text-accent-ink" aria-hidden="true" />
                    </span>
                    <Dialog.Title className="font-display text-xl font-bold text-ink">
                      They&apos;re on the roster!
                    </Dialog.Title>
                    <Dialog.Description className="text-sm leading-relaxed text-ink-2">
                      The new client is saved and waiting for their first
                      campaign. We&apos;ll handle the paperwork-y bits.
                    </Dialog.Description>
                    <Button
                      variant="mint"
                      className="mt-2"
                      onClick={() => {
                        handleOpenChange(false);
                        router.refresh();
                      }}
                    >
                      <Check className="h-4 w-4" aria-hidden />
                      Lovely
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Dialog.Title className="font-display text-xl font-bold text-ink">
                          Add a client
                        </Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm text-ink-2">
                          Start with the basics. You can fill in the rest later.
                        </Dialog.Description>
                      </div>
                      <Dialog.Close asChild>
                        <Button variant="ghost" size="icon" aria-label="Close dialog">
                          <X className="h-4 w-4" aria-hidden />
                        </Button>
                      </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                      <div>
                        <Label htmlFor="client-name">Client name</Label>
                        <Input
                          id="client-name"
                          name="name"
                          required
                          placeholder="e.g. Sunbeam Bakery"
                          autoComplete="organization"
                        />
                      </div>
                      <div>
                        <Label htmlFor="client-industry">Industry</Label>
                        <Input
                          id="client-industry"
                          name="industry"
                          required
                          placeholder="e.g. Artisan bakery"
                          autoComplete="organization-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="client-website">Website</Label>
                        <Input
                          id="client-website"
                          name="website"
                          type="url"
                          placeholder="https://sunbeambakery.example"
                          autoComplete="url"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Dialog.Close asChild>
                          <Button type="button" variant="ghost">
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Button type="submit" variant="mint" disabled={submitting}>
                          {submitting ? "Adding…" : "Add client"}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>

      {/* ---------- Results ---------- */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={clients.length === 0 ? "new" : "search"}
          title={
            clients.length === 0
              ? "No clients yet, the roster is a blank canvas"
              : "Nothing matches that"
          }
          description={
            clients.length === 0
              ? "Add your first client and we’ll build the boring parts for you: health scores, retainers, and a dashboard that tells the truth."
              : "Try a different search, or clear the filters. We’re not judging."
          }
          action={
            clients.length === 0 ? (
              <Button variant="mint" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Add the first client
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setStatus("ALL");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className="text-xs font-bold text-muted">
            Showing {filtered.length} of {clients.length}{" "}
            {clients.length === 1 ? "client" : "clients"}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((client, i) => (
              <ClientCard
                key={client.id}
                client={client}
                metrics={metricsById.get(client.id) ?? null}
                index={i}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

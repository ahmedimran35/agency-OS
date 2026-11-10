"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Switch from "@radix-ui/react-switch";
import {
  Check,
  Loader,
  Play,
  Plus,
  Workflow,
  X,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Label,
  SectionHeading,
} from "@/components/ui";
import { ToastProvider, useToast } from "@/components/agency-toast";
import { Icon, type IconName } from "@/components/icons";
import { cn, formatRelative } from "@/lib/utils";
import type { Client } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Recipe model                                                        */
/* ------------------------------------------------------------------ */

interface Recipe {
  id: string;
  name: string;
  icon: string;
  trigger: string;
  action: string;
  /** Client ids this recipe is scoped to; empty = all clients. */
  scope: string[];
  enabled: boolean;
  /** Hours ago the recipe last ran. Null = never. */
  lastRunHoursAgo: number | null;
  runs: number;
  app: string;
  appIcon: string;
}

const RECIPES: Recipe[] = [
  {
    id: "auto_report",
    name: "Monthly client report → PDF + email",
    icon: "analytics",
    trigger: "On the 1st of every month at 08:00",
    action: "Build the white-label PDF, then email it to the client's contacts",
    scope: [],
    enabled: true,
    lastRunHoursAgo: 70,
    runs: 14,
    app: "Umami + Resend",
    appIcon: "trend",
  },
  {
    id: "auto_schedule",
    name: "New content approved → schedule to Mixpost",
    icon: "campaign",
    trigger: "When a content item moves to Approved",
    action: "Schedule it in Mixpost for the client's next available slot",
    scope: ["cli_bee", "cli_north"],
    enabled: true,
    lastRunHoursAgo: 5,
    runs: 92,
    app: "Mixpost",
    appIcon: "calendar",
  },
  {
    id: "auto_health",
    name: "Low health score → Slack alert",
    icon: "health",
    trigger: "When a client's health score drops below 65",
    action: "Post a message to the #client-alerts channel",
    scope: [],
    enabled: true,
    lastRunHoursAgo: 52,
    runs: 6,
    app: "Node-RED",
    appIcon: "route",
  },
  {
    id: "auto_repost",
    name: "SEO post published → social repost",
    icon: "route",
    trigger: "When a blog post goes live",
    action: "Queue a LinkedIn + X post pointing at the new article",
    scope: ["cli_lumen", "cli_paper"],
    enabled: false,
    lastRunHoursAgo: 220,
    runs: 31,
    app: "Mixpost",
    appIcon: "calendar",
  },
  {
    id: "auto_invoice",
    name: "Retainer renewal → draft invoice",
    icon: "receipt",
    trigger: "7 days before a retainer renews",
    action: "Create a draft invoice in SolidInvoice and ping the account owner",
    scope: [],
    enabled: false,
    lastRunHoursAgo: null,
    runs: 0,
    app: "SolidInvoice",
    appIcon: "wallet",
  },
  {
    id: "auto_welcome",
    name: "New client → welcome sequence",
    icon: "sparkle",
    trigger: "When a client is created",
    action: "Send a welcome email and spin up the onboarding checklist",
    scope: [],
    enabled: true,
    lastRunHoursAgo: 288,
    runs: 5,
    app: "Dittofeed",
    appIcon: "email",
  },
];

/* ------------------------------------------------------------------ */
/* Templates for the new-automation dialog                             */
/* ------------------------------------------------------------------ */

const TEMPLATES: {
  name: string;
  icon: string;
  description: string;
  trigger: string;
  action: string;
}[] = [
  {
    name: "Weekly performance digest",
    icon: "email",
    description: "Send a short summary of last week's numbers to internal Slack.",
    trigger: "Every Monday at 09:00",
    action: "Pull the week's metrics and post them to #week-in-review",
  },
  {
    name: "Content request reminder",
    icon: "clock",
    description: "Nudge the client when their approval sits too long.",
    trigger: "3 days after a content item is sent for approval",
    action: "Email the client contact and notify the account owner",
  },
  {
    name: "New lead → CRM entry",
    icon: "goal",
    description: "Push website enquiries straight into the pipeline.",
    trigger: "When a form submission arrives",
    action: "Create a Lead deal in Krayin and assign it round-robin",
  },
  {
    name: "Budget threshold alert",
    icon: "wallet",
    description: "Warn before a campaign overspends.",
    trigger: "When campaign spend crosses 80% of budget",
    action: "Post an alert with the campaign name and remaining budget",
  },
];

/* ------------------------------------------------------------------ */
/* Registry                                                            */
/* ------------------------------------------------------------------ */

function AutomationsRegistryInner({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const [recipes, setRecipes] = React.useState<Recipe[]>(RECIPES);
  const [running, setRunning] = React.useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const clientName = React.useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client",
    [clients],
  );

  const toggle = (id: string, enabled: boolean) => {
    const recipe = recipes.find((r) => r.id === id);
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled } : r)),
    );
    toast({
      title: enabled ? "Automation switched on" : "Automation paused",
      description: recipe
        ? `${recipe.name} is ${enabled ? "watching for triggers" : "taking a nap"}.`
        : undefined,
      tone: enabled ? "mint" : "butter",
      icon: enabled ? "speed" : "clock",
    });
  };

  const runNow = (recipe: Recipe) => {
    if (running[recipe.id]) return;
    setRunning((prev) => ({ ...prev, [recipe.id]: true }));

    // Simulated run: brief loading, then a friendly success.
    window.setTimeout(() => {
      setRunning((prev) => ({ ...prev, [recipe.id]: false }));
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id
            ? { ...r, lastRunHoursAgo: 0, runs: r.runs + 1 }
            : r,
        ),
      );
      toast({
        title: "Run finished successfully",
        description: `${recipe.name} finished in 1.8s.`,
        tone: "mint",
        icon: "check",
      });
    }, 1600);
  };

  const enabledCount = recipes.filter((r) => r.enabled).length;
  const totalRuns = recipes.reduce((sum, r) => sum + r.runs, 0);

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="bot"
        title="Automations"
        description="Recipes that do the boring bits for you, on autopilot."
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New automation
          </Button>
        }
      />

      <Card className="animate-rise">
        <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
          <div>
            <p className="text-[11px] font-bold text-muted">
              Active recipes
            </p>
            <p className="font-display text-2xl font-bold text-ink">
              {enabledCount}
              <span className="text-base font-bold text-muted">
                /{recipes.length}
              </span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted">
              Total runs
            </p>
            <p className="font-display text-2xl font-bold text-ink">
              {totalRuns}
            </p>
          </div>
          <p className="flex-1 text-sm text-ink-2">
            Recipes run through Node-RED. Turn one off and it pauses politely, nothing fires until you switch it back on.
          </p>
        </CardContent>
      </Card>

      {recipes.length === 0 ? (
        <EmptyState
          icon="bot"
          title="No automations yet"
          description="Build your first recipe and let the busywork take care of itself."
          action={
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New automation
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {recipes.map((recipe, i) => (
            <Card
              key={recipe.id}
              className={cn(
                "animate-rise flex flex-col transition-shadow hover:shadow-card",
                !recipe.enabled && "opacity-75",
              )}
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-paper-3 text-xl"
                      aria-hidden
                    >
                      <Icon name={recipe.icon as IconName} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base">{recipe.name}</CardTitle>
                      <p className="mt-1 text-xs font-bold text-muted">
                        {recipe.appIcon} {recipe.app}
                      </p>
                    </div>
                  </div>

                  <Switch.Root
                    checked={recipe.enabled}
                    onCheckedChange={(checked) => toggle(recipe.id, checked)}
                    aria-label={`${recipe.enabled ? "Disable" : "Enable"} ${recipe.name}`}
                    className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-paper-3 transition-colors outline-none data-[state=checked]:bg-paper-3 focus-visible:ring-4 focus-visible:ring-accent/25"
                  >
                    <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-paper-2 shadow-card transition-transform duration-200 ease-[var(--ease-spring)] data-[state=checked]:translate-x-[22px]" />
                  </Switch.Root>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3">
                <div className="rounded-control bg-paper-3/60 px-3 py-2.5">
                  <p className="text-[11px] font-bold text-muted">
                    Trigger
                  </p>
                  <p className="mt-1 text-xs font-bold text-ink">
                    {recipe.trigger}
                  </p>
                </div>
                <div className="rounded-control bg-paper-3/60 px-3 py-2.5">
                  <p className="text-[11px] font-bold text-muted">
                    Action
                  </p>
                  <p className="mt-1 text-xs font-bold text-ink">
                    {recipe.action}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-muted">
                    Scope
                  </span>
                  {recipe.scope.length === 0 ? (
                    <Badge tone="neutral">All clients</Badge>
                  ) : (
                    recipe.scope.map((id) => (
                      <Badge key={id} tone="sky">
                        {clientName(id)}
                      </Badge>
                    ))
                  )}
                </div>
              </CardContent>

              <div className="flex items-center justify-between gap-2 border-t border-rule px-5 py-3">
                <span className="text-[11px] font-bold text-muted">
                  {recipe.lastRunHoursAgo === null
                    ? "Never run yet"
                    : `Last run ${formatRelative(
                        new Date(Date.now() - recipe.lastRunHoursAgo * 3_600_000),
                      )}`}{" "}
                  · {recipe.runs} runs
                </span>
                <Button
                  variant={recipe.enabled ? "outline" : "secondary"}
                  size="sm"
                  disabled={running[recipe.id]}
                  onClick={() => runNow(recipe)}
                >
                  {running[recipe.id] ? (
                    <>
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                      Running
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" />
                      Run now
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <NewAutomationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={(name) => {
          const id = `auto_${Date.now().toString(36)}`;
          setRecipes((prev) => [
            {
              id,
              name,
              icon: "magic",
              trigger: "Not set yet",
              action: "Not set yet",
              scope: [],
              enabled: false,
              lastRunHoursAgo: null,
              runs: 0,
              app: "Node-RED",
              appIcon: "route",
            },
            ...prev,
          ]);
          setDialogOpen(false);
          toast({
            title: "Automation created",
            description: `${name} is switched off for now, configure it when you’re ready.`,
            tone: "lilac",
            icon: "magic",
          });
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* New automation dialog                                               */
/* ------------------------------------------------------------------ */

function NewAutomationDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-paper-3/95 " />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-rule bg-paper-2 p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-ink">
                New automation
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-ink-2">
                Start from a template, you can tweak the details afterwards.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <fieldset className="mt-5">
            <legend className="mb-3 text-xs font-bold text-muted">
              Pick a template
            </legend>
            <div className="space-y-2">
              {TEMPLATES.map((tpl) => {
                const active = selected === tpl.name;
                return (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => setSelected(active ? null : tpl.name)}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-card border p-3.5 text-left transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                      active
                        ? "border-accent bg-paper-2 shadow-card"
                        : "border-rule bg-paper-2 hover:border-rule hover:bg-paper-3/50",
                    )}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-paper-3 text-base"
                      aria-hidden
                    >
                      <Icon name={tpl.icon as IconName} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-sm font-bold text-ink">
                        {tpl.name}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">
                        {tpl.description}
                      </span>
                      <span className="mt-2 block text-[11px] font-bold text-muted">
                        When: {tpl.trigger}
                      </span>
                      <span className="block text-[11px] font-bold text-muted">
                        Then: {tpl.action}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        active
                          ? "border-accent bg-paper-2 text-ink"
                          : "border-rule",
                      )}
                      aria-hidden
                    >
                      {active && <Check className="h-3 w-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button
              disabled={!selected}
              onClick={() => {
                if (selected) onCreate(selected);
                setSelected(null);
              }}
            >
              <Workflow className="h-4 w-4" />
              Create automation
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function AutomationsRegistry({ clients }: { clients: Client[] }) {
  return (
    <ToastProvider>
      <AutomationsRegistryInner clients={clients} />
    </ToastProvider>
  );
}

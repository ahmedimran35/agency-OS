"use client";

import * as React from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Sparkles,
  ArrowUpRight,
  Bot,
  Check,
  CreditCard,
  Mail,
  Palette,
  Plug,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  SectionHeading,
} from "@/components/ui";
import { ToastProvider, useToast } from "@/components/agency-toast";
import { Icon, type IconName } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Brand palette                                                       */
/* ------------------------------------------------------------------ */

const BRAND_SWATCHES = [
  { name: "Peach", value: "oklch(83% 0.115 56)", className: "bg-accent" },
  { name: "Deep peach", value: "oklch(74% 0.15 46)", className: "bg-accent-2" },
  { name: "Ground", value: "oklch(41% 0.1 154)", className: "bg-paper" },
  { name: "Tile", value: "oklch(47% 0.105 154)", className: "bg-paper-2" },
  { name: "Well", value: "oklch(34% 0.09 156)", className: "bg-paper-3" },
];

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
}

const TEAM: Member[] = [
  {
    id: "m1",
    name: "Imran Ahmed",
    email: "imran@brightside.example",
    role: "OWNER",
    lastActive: "Just now",
  },
  {
    id: "m2",
    name: "Priya Raman",
    email: "priya@brightside.example",
    role: "MANAGER",
    lastActive: "2 hours ago",
  },
  {
    id: "m3",
    name: "Sofia Marin",
    email: "sofia@brightside.example",
    role: "EDITOR",
    lastActive: "Yesterday",
  },
  {
    id: "m4",
    name: "Devon Clarke",
    email: "devon@brightside.example",
    role: "EDITOR",
    lastActive: "Yesterday",
  },
  {
    id: "m5",
    name: "Maya Okonkwo",
    email: "maya@beeandbloom.example",
    role: "CLIENT",
    lastActive: "3 days ago",
  },
  {
    id: "m6",
    name: "Tobias Rune",
    email: "tobias@northwind.example",
    role: "CLIENT",
    lastActive: "5 days ago",
  },
];

const ROLE_TONE: Record<Role, "mint" | "sky" | "butter" | "neutral"> = {
  OWNER: "mint",
  MANAGER: "sky",
  EDITOR: "butter",
  CLIENT: "neutral",
};

/* ------------------------------------------------------------------ */
/* Integrations                                                        */
/* ------------------------------------------------------------------ */

interface Integration {
  id: string;
  name: string;
  icon: string;
  description: string;
  accent: "mint" | "peach" | "sky" | "butter" | "lilac";
  connected: boolean;
  detail?: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "mixpost",
    name: "Mixpost",
    icon: "calendar",
    description: "Social scheduling for every channel we publish to.",
    accent: "lilac",
    connected: true,
    detail: "4 workspaces · 2 accounts",
  },
  {
    id: "dittofeed",
    name: "Dittofeed",
    icon: "email",
    description: "Email journeys, broadcasts, and the occasional newsletter.",
    accent: "sky",
    connected: true,
    detail: "12 active journeys",
  },
  {
    id: "krayin",
    name: "Krayin CRM",
    icon: "goal",
    description: "The CRM that mirrors our pipeline board.",
    accent: "peach",
    connected: true,
    detail: "Synced 6 minutes ago",
  },
  {
    id: "huly",
    name: "Huly",
    icon: "setup",
    description: "Projects, tasks and team chat in one place.",
    accent: "mint",
    connected: false,
  },
  {
    id: "umami",
    name: "Umami",
    icon: "trend",
    description: "Privacy-friendly analytics. Where the numbers come from.",
    accent: "butter",
    connected: true,
    detail: "5 client websites",
  },
  {
    id: "node-red",
    name: "Node-RED",
    icon: "route",
    description: "Runs the recipe on a schedule.",
    accent: "peach",
    connected: true,
    detail: "6 flows deployed",
  },
  {
    id: "superset",
    name: "Apache Superset",
    icon: "analytics",
    description: "Internal BI for cross-client analysis.",
    accent: "sky",
    connected: false,
  },
  {
    id: "penpot",
    name: "Penpot",
    icon: "palette",
    description: "Design files, components and collaborative mockups.",
    accent: "lilac",
    connected: false,
  },
];

const ACCENT_TINT: Record<Integration["accent"], string> = {
  mint: "bg-paper-2",
  peach: "bg-paper-3",
  sky: "bg-paper-2",
  butter: "bg-paper-3",
  lilac: "bg-paper-2",
};

/* ------------------------------------------------------------------ */
/* Billing                                                             */
/* ------------------------------------------------------------------ */

interface Meter {
  id: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
  icon: string;
  accent: "mint" | "peach" | "sky" | "butter" | "lilac";
}

const METERS: Meter[] = [
  {
    id: "cf_builds",
    label: "Cloudflare Pages builds",
    used: 82,
    limit: 500,
    unit: "builds",
    icon: "database",
    accent: "sky",
  },
  {
    id: "resend",
    label: "Resend emails",
    used: 1240,
    limit: 3000,
    unit: "emails",
    icon: "email",
    accent: "peach",
  },
  {
    id: "neon",
    label: "Neon database",
    used: 380,
    limit: 1024,
    unit: "MB",
    icon: "database",
    accent: "mint",
  },
  {
    id: "r2",
    label: "Cloudflare R2 storage",
    used: 2.4,
    limit: 10,
    unit: "GB",
    icon: "package",
    accent: "butter",
  },
  {
    id: "groq",
    label: "Groq API requests",
    used: 640,
    limit: 1000,
    unit: "requests",
    icon: "speed",
    accent: "lilac",
  },
  {
    id: "workers",
    label: "Cloudflare Workers requests",
    used: 41000,
    limit: 100000,
    unit: "requests",
    icon: "setup",
    accent: "sky",
  },
];

function formatUsage(m: Meter): string {
  if (m.unit === "GB") {
    return `${m.used} GB / ${m.limit} GB`;
  }
  return `${m.used.toLocaleString("en-US")} / ${m.limit.toLocaleString("en-US")} ${m.unit}`;
}

/* ------------------------------------------------------------------ */
/* Workbench                                                           */
/* ------------------------------------------------------------------ */

function SettingsWorkbenchInner() {
  const { toast } = useToast();
  const [agencyName, setAgencyName] = React.useState("Brightside Studio");
  const [slug, setSlug] = React.useState("brightside-studio");
  const [brandColor, setBrandColor] = React.useState(BRAND_SWATCHES[0].value);
  const [members, setMembers] = React.useState<Member[]>(TEAM);
  const [integrations, setIntegrations] =
    React.useState<Integration[]>(INTEGRATIONS);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<Role>("EDITOR");

  const saveAgency = () => {
    toast({
      title: "Agency details saved",
      description: `${agencyName} Your agency details are updated across the workspace.`,
      tone: "mint",
      icon: "database",
    });
  };

  const toggleIntegration = (id: string) => {
    const integration = integrations.find((i) => i.id === id);
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, connected: !i.connected, detail: undefined }
          : i,
      ),
    );
    toast({
      title: integration?.connected ? "Disconnected" : "Connected",
      description: integration
        ? `${integration.name} is ${integration.connected ? "taking a break" : "is connected"}.`
        : undefined,
      tone: integration?.connected ? "butter" : "mint",
      icon: integration?.connected ? "integration" : "attachment",
    });
  };

  const sendInvite = () => {
    const email = inviteEmail.trim();
    if (!email) {
      toast({
        title: "Who are we inviting?",
        description: "An email address is needed to send the invite.",
        tone: "butter",
        icon: "mail",
      });
      return;
    }
    const name = email
      .split("@")[0]
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    setMembers((prev) => [
      ...prev,
      {
        id: `m_${Date.now().toString(36)}`,
        name,
        email,
        role: inviteRole,
        lastActive: "Invite pending",
      },
    ]);
    setInviteEmail("");
    setInviteOpen(false);
    toast({
      title: "Invitation sent",
      description: `${email} will get a link to join as ${ROLE_LABELS[inviteRole]}.`,
      tone: "mint",
      icon: "mail",
    });
  };

  const accentName =
    BRAND_SWATCHES.find((s) => s.value === brandColor)?.name ?? "Mint";

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="setup"
        title="Settings"
        description="The knobs behind the operation. Everything here is free-tier friendly."
      />

      <Tabs.Root defaultValue="agency" className="space-y-6">
        <Tabs.List
          className="flex gap-1 overflow-x-auto border-b-2 border-rule"
          aria-label="Settings sections"
        >
          {(
            [
              { value: "agency", label: "Agency", icon: "building" },
              { value: "team", label: "Team", icon: "users" },
              { value: "integrations", label: "Integrations", icon: "integration" },
              { value: "billing", label: "Billing", icon: "invoice" },
              { value: "ai", label: "AI", icon: "bot" },
            ] as const
          ).map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="shrink-0 rounded-control px-3.5 py-2 text-sm font-bold whitespace-nowrap text-ink-2 transition-colors outline-none hover:text-ink focus-visible:ring-4 focus-visible:ring-accent/20 data-[state=active]:bg-paper-2 data-[state=active]:text-ink data-[state=active]:shadow-card"
            >
              <span aria-hidden className="mr-1.5">
                <Icon name={tab.icon as IconName} className="h-4 w-4" />
              </span>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* ---------------- AGENCY ---------------- */}
        <Tabs.Content value="agency" className="outline-none">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="animate-rise">
              <CardHeader>
                <CardTitle>Agency details</CardTitle>
                <p className="text-sm text-ink-2">
                  What we call ourselves, and where clients find us.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="agency-name">Agency name</Label>
                  <Input
                    id="agency-name"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="agency-slug">Workspace slug</Label>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-sm font-bold text-muted">
                      brightside.app/
                    </span>
                    <Input
                      id="agency-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="agency-logo">Logo</Label>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-14 w-14 items-center justify-center rounded-control bg-paper-3"
                      aria-hidden
                    >
                      <Sparkles className="h-6 w-6 text-ink" />
                    </span>
                    <div className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toast({
                            title: "Upload mock",
                            description:
                              "File pickers are for the real thing. Your current mark looks great, so we kept it.",
                            tone: "sky",
                            icon: "send",
                          })
                        }
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload logo
                      </Button>
                      <p className="mt-1.5 text-[11px] text-muted">
                        SVG or PNG, at least 256×256.
                      </p>
                    </div>
                  </div>
                </div>
                <Button onClick={saveAgency}>
                  <Check className="h-4 w-4" />
                  Save changes
                </Button>
              </CardContent>
            </Card>

            <Card className="animate-rise">
              <CardHeader>
                <CardTitle>Brand colour</CardTitle>
                <p className="text-sm text-ink-2">
                  The accent that shows up across your client-facing documents.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <fieldset>
                  <legend className="mb-3 text-sm font-bold text-ink-2">
                    Pick an accent
                  </legend>
                  <div className="flex flex-wrap gap-3">
                    {BRAND_SWATCHES.map((swatch) => {
                      const active = brandColor === swatch.value;
                      return (
                        <button
                          key={swatch.value}
                          type="button"
                          onClick={() => setBrandColor(swatch.value)}
                          aria-label={`${swatch.name} accent`}
                          aria-pressed={active}
                          className={cn(
                            "flex h-14 w-14 items-center justify-center rounded-card transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                            swatch.className,
                            active
                              ? "ring-2 ring-ink ring-offset-2 ring-offset-paper"
                              : "hover:scale-105",
                          )}
                        >
                          {active && (
                            <Check
                              className="h-5 w-5 text-ink"
                              strokeWidth={3}
                              aria-hidden
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="border border-rule bg-paper-3/30 p-4">
                  <p className="text-[11px] font-bold text-muted">
                    Preview
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-control"
                      style={{ backgroundColor: brandColor }}
                      aria-hidden
                    >
                      <Sparkles className="h-5 w-5 text-ink" />
                    </span>
                    <div>
                      <p className="font-display text-base font-bold text-ink">
                        {agencyName}
                      </p>
                      <p className="text-xs text-ink-2">
                        {accentName} accent · reports and proposals
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border border-rule p-4">
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
                    <Palette
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink"
                      aria-hidden
                    />
                    Brand colours never flip in dark mode. Your pastels stay
                    exactly this warm.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs.Content>

        {/* ---------------- TEAM ---------------- */}
        <Tabs.Content value="team" className="outline-none">
          <Card className="animate-rise">
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>Team & clients</CardTitle>
                <p className="mt-1 text-sm text-ink-2">
                  {members.length} people with access to this workspace.
                </p>
              </div>
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-line">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Avatar name={member.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold text-ink">
                        {member.name}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {member.email}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-muted">
                      {member.lastActive}
                    </span>
                    <Badge tone={ROLE_TONE[member.role]}>
                      {ROLE_LABELS[member.role]}
                    </Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            {(["OWNER", "MANAGER", "EDITOR", "CLIENT"] as Role[]).map((role) => (
              <Card key={role} className="animate-rise">
                <CardContent className="p-4">
                  <p className="text-[11px] font-bold text-muted">
                    {ROLE_LABELS[role]}
                  </p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">
                    {members.filter((m) => m.role === role).length}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs.Content>

        {/* ---------------- INTEGRATIONS ---------------- */}
        <Tabs.Content value="integrations" className="outline-none">
          <Card className="animate-rise">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-4 w-4 text-muted" aria-hidden />
                Connected services
              </CardTitle>
              <p className="text-sm text-ink-2">
                All of these are open source and free to self-host. Connect the
                ones you use, ignore the rest, no pressure.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {integrations.map((integration, i) => (
                  <Card
                    key={integration.id}
                    className="animate-rise transition-shadow hover:shadow-card"
                    style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  >
                    <CardContent className="flex h-full flex-col gap-3 p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-card text-xl",
                            ACCENT_TINT[integration.accent],
                          )}
                          aria-hidden
                        >
                          <Icon name={integration.icon as IconName} className="h-5 w-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-sm font-bold text-ink">
                            {integration.name}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
                            {integration.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                        <span className="min-w-0 truncate text-[11px] font-bold text-muted">
                          {integration.connected
                            ? (integration.detail ?? "Connected")
                            : "Not connected"}
                        </span>
                        <Button
                          variant={integration.connected ? "outline" : "secondary"}
                          size="sm"
                          onClick={() => toggleIntegration(integration.id)}
                        >
                          {integration.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>

        {/* ---------------- BILLING ---------------- */}
        <Tabs.Content value="billing" className="outline-none">
          <div className="space-y-5">
            <Card className="animate-rise overflow-hidden">
              <div className="h-1.5 w-full bg-paper-3" aria-hidden />
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted" aria-hidden />
                    Free tier usage
                  </CardTitle>
                  <p className="mt-1 text-sm text-ink-2">
                    Everything below is running on free tiers. We&apos;ll warn
                    you before anything runs out.
                  </p>
                </div>
                <Badge tone="mint">$0 / month</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {METERS.map((meter) => {
                    const pct = (meter.used / meter.limit) * 100;
                    const warn = pct >= 80;
                    return (
                      <div key={meter.id}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-ink">
                            <Icon name={meter.icon as IconName} className="h-4 w-4" />
                            <span className="truncate">{meter.label}</span>
                          </span>
                          <span
                            className={cn(
                              "shrink-0 text-[11px] font-bold tabular-nums",
                              warn ? "text-danger" : "text-muted",
                            )}
                          >
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          accent={warn ? "danger" : meter.accent}
                        />
                        <p className="mt-1.5 text-[11px] font-bold text-muted tabular-nums">
                          {formatUsage(meter)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {METERS.some((m) => (m.used / m.limit) * 100 >= 80) && (
                  <div className="mt-5 border border-rule p-4">
                    <p className="text-xs leading-relaxed text-ink-2">
                      <span className="font-bold text-ink">
                        Heads up:
                      </span>{" "}
                      Groq is nearly through its daily free allowance, and
                      Cloudflare Pages builds are past 80%. We&apos;ll queue
                      requests rather than fail them.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="animate-rise">
                <CardHeader>
                  <CardTitle>What you&apos;re paying</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-2">Platform</span>
                    <span className="font-display text-lg font-bold text-ink">
                      $0
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-2">Integrations</span>
                    <span className="font-display text-lg font-bold text-ink">
                      $0
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-rule pt-3">
                    <span className="text-sm font-bold text-ink">Total</span>
                    <span className="font-display text-lg font-bold text-success-text">
                      $0
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-rise">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted" aria-hidden />
                    Billing contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-ink-2">
                    Invoices and quota warnings go to:
                  </p>
                  <Input
                    defaultValue="imran@brightside.example"
                    aria-label="Billing email address"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      toast({
                        title: "Billing contact updated",
                        description: "We will send the next invoice there.",
                        tone: "mint",
                        icon: "receipt",
                      })
                    }
                  >
                    Update contact
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs.Content>

        {/* ---------------- AI ---------------- */}
        <Tabs.Content value="ai" className="outline-none">
          <Card className="animate-rise overflow-hidden">
            <div className="h-1.5 w-full bg-paper-3" aria-hidden />
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control bg-paper-2"
                  aria-hidden
                >
                  <Bot className="h-5 w-5" aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-xl font-bold text-ink">
                    AI providers
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
                    Brightside never ships a paid AI account. Point it at any
                    OpenAI-compatible endpoint, Gemini, Groq, OpenRouter,
                    Ollama on your own machine, and pick the models you want
                    per task.
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      {
                        title: "Bring your own key",
                        body: "Your keys stay in your workspace. We never proxy them.",
                      },
                      {
                        title: "Quota-aware fallbacks",
                        body: "Bulk work goes to cheap models, quality work to good ones.",
                      },
                      {
                        title: "Local-first",
                        body: "Ollama runs unlimited on hardware you already own.",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="border border-rule p-4"
                      >
                        <p className="font-display text-sm font-bold text-ink">
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-2">
                          {item.body}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link href="/settings/providers">
                      <Button>
                        <Bot className="h-4 w-4" />
                        Manage AI providers
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <span className="text-xs font-bold text-muted">
                      0 providers configured yet
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Tabs.Content>
      </Tabs.Root>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        email={inviteEmail}
        setEmail={setInviteEmail}
        role={inviteRole}
        setRole={setInviteRole}
        onSend={sendInvite}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Invite dialog                                                       */
/* ------------------------------------------------------------------ */

function InviteDialog({
  open,
  onOpenChange,
  email,
  setEmail,
  role,
  setRole,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  setEmail: (v: string) => void;
  role: Role;
  setRole: (r: Role) => void;
  onSend: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-paper-3/95 " />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-rule bg-paper-2 p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-lg font-bold text-ink">
                Invite someone
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-ink-2">
                They&apos;ll get an email with a link to join.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close dialog">
                <X className="h-4 w-4" />
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={selectClass}
              >
                {(["OWNER", "MANAGER", "EDITOR", "CLIENT"] as Role[]).map(
                  (r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ),
                )}
              </select>
              <p className="mt-1.5 text-xs text-muted">
                Clients can see their own reports and campaigns, nothing else.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <Button variant="ghost">Cancel</Button>
            </Dialog.Close>
            <Button onClick={onSend}>
              <UserPlus className="h-4 w-4" />
              Send invite
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

const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-control border border-rule bg-paper-2 px-3.5 pr-9 text-sm text-ink transition-colors hover:border-rule focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export function SettingsWorkbench() {
  return (
    <ToastProvider>
      <SettingsWorkbenchInner />
    </ToastProvider>
  );
}

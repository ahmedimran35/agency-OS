"use client";

import { Icon, type IconName } from "@/components/icons";
import * as React from "react";
import * as Checkbox from "@radix-ui/react-checkbox";
import { BookOpen, Check, Clock, Search } from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  SectionHeading,
} from "@/components/ui";
import { cn, formatRelative } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Playbook model                                                      */
/* ------------------------------------------------------------------ */

type Category = "Onboarding" | "Campaign" | "Content" | "Reporting";

interface Section {
  heading: string;
  body: string[];
}

interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
}

interface Playbook {
  id: string;
  title: string;
  category: Category;
  owner: string;
  updatedDaysAgo: number;
  readMinutes: number;
  icon: string;
  summary: string;
  sections: Section[];
  checklist?: ChecklistItem[];
}

const PLAYBOOKS: Playbook[] = [
  {
    id: "pb_onboarding",
    title: "Client onboarding checklist",
    category: "Onboarding",
    owner: "Priya Raman",
    updatedDaysAgo: 2,
    readMinutes: 6,
    icon: "new",
    summary:
      "Everything we do between 'yes' and 'here's your first month'. Follow it top to bottom and no one gets forgotten.",
    sections: [
      {
        heading: "Why this matters",
        body: [
          "A smooth first month is the cheapest retention tool we have. Clients who feel set up properly from day one renew at roughly twice the rate of clients who spend their first month wondering what's happening.",
          "The goal is simple: within ten working days, the client should have seen something real, a live page, a first post, or a first report, and should know exactly who's looking after them.",
        ],
      },
      {
        heading: "The first 48 hours",
        body: [
          "Send the welcome note with a single question: who else needs access? Resist the urge to send a wall of links. One ask, one reply, one clear next step.",
          "Book the kick-off call inside the first week while everyone still remembers saying yes.",
        ],
      },
      {
        heading: "Days 3,10",
        body: [
          "Set up analytics, connect the content calendar, and agree the first reporting period. If a deliverable is going to take longer than a fortnight, say so now rather than at the deadline.",
          "Add the client to the delivery board with real due dates, not placeholders.",
        ],
      },
    ],
    checklist: [
      {
        id: "ob_1",
        label: "Send the welcome note",
        detail: "One question, one link. No brochures.",
      },
      {
        id: "ob_2",
        label: "Collect brand assets",
        detail: "Logos, fonts, colour palette, tone-of-voice doc.",
      },
      { id: "ob_3", label: "Book the kick-off call" },
      {
        id: "ob_4",
        label: "Connect analytics (Umami)",
        detail: "Share the dashboard, don’t just send a screenshot.",
      },
      { id: "ob_5", label: "Set up the content calendar" },
      { id: "ob_6", label: "Agree the first reporting period" },
      {
        id: "ob_7",
        label: "Add tasks to the delivery board",
        detail: "Real dates only.",
      },
      { id: "ob_8", label: "Invite the client to the shared drive" },
    ],
  },
  {
    id: "pb_campaign",
    title: "Launching a new campaign",
    category: "Campaign",
    owner: "Imran Ahmed",
    updatedDaysAgo: 5,
    readMinutes: 8,
    icon: "launch",
    summary:
      "The shape of a campaign launch, from first brief to the week after it goes live.",
    sections: [
      {
        heading: "Before you brief anything",
        body: [
          "A campaign without a single clear goal is just a pile of content. Write down the one number you want to move, the number you want it to reach, and the date you want to see it.",
          "Three numbers is the maximum. More than that and nobody remembers any of them.",
        ],
      },
      {
        heading: "The brief",
        body: [
          "One page, no more. Audience, promise, channels, budget range, dates, and the single success metric. Everything else lives in a linked doc.",
          "If the client cannot summarise the brief back to you in one sentence, rewrite it.",
        ],
      },
      {
        heading: "The week after launch",
        body: [
          "Check the first three days for anything structurally broken, tracking, links, formatting. Don't judge performance yet; nobody has seen it.",
          "By day seven, write down one thing that worked and one thing that didn’t. Feed both into the next brief.",
        ],
      },
    ],
  },
  {
    id: "pb_content",
    title: "Writing content that sounds like a human",
    category: "Content",
    owner: "Sofia Marin",
    updatedDaysAgo: 11,
    readMinutes: 5,
    icon: "content",
    summary:
      "House style, the banned phrases, and how to write for a brand that has an actual personality.",
    sections: [
      {
        heading: "The voice test",
        body: [
          "Read the draft out loud. If you run out of breath or wince at a phrase, it needs another pass. Most bad copy is invisible on screen and unbearable in the ear.",
          "Write like you'd explain it to a smart friend over coffee, not like a brochure, and not like a textbook.",
        ],
      },
      {
        heading: "Banned phrases",
        body: [
          "In today's fast-paced world, game-changer, unlock, elevate, seamless, journey, and 'in today's digital landscape'. They cost you trust and buy you nothing.",
        ],
      },
      {
        heading: "Specificity is kindness",
        body: [
          "Replace every vague claim with a concrete one. 'Saves time' becomes 'cuts the report from two hours to twenty minutes'. The reader can picture themselves in it.",
        ],
      },
    ],
  },
  {
    id: "pb_reporting",
    title: "Running a monthly client report",
    category: "Reporting",
    owner: "Devon Clarke",
    updatedDaysAgo: 1,
    readMinutes: 7,
    icon: "analytics",
    summary:
      "How we turn a month of numbers into something the client actually reads, and acts on.",
    sections: [
      {
        heading: "The five-minute rule",
        body: [
          "If the client can’t get the point in five minutes, the report is too long. Lead with the headline metric, the change, and the one action we’re recommending.",
          "Everything else is supporting evidence for those three things.",
        ],
      },
      {
        heading: "Context beats comparison",
        body: [
          "A number without a comparison is just a number. Always pair it with the previous period, the target, or the same period last year.",
          "If performance dropped, say why you think it dropped. 'Down 12%' is a worry; 'down 12% while the launch post took 40% of impressions' is a story.",
        ],
      },
      {
        heading: "One recommendation",
        body: [
          "Never send a report with three recommendations. The client will do none of them. Send one, make it specific, and make it easy to say yes to.",
        ],
      },
    ],
  },
  {
    id: "pb_retention",
    title: "When a client starts to wobble",
    category: "Onboarding",
    owner: "Imran Ahmed",
    updatedDaysAgo: 19,
    readMinutes: 6,
    icon: "health",
    summary:
      "Early warning signs of a slipping account, and what to do before it becomes a cancellation.",
    sections: [
      {
        heading: "The signals",
        body: [
          "Slower replies. Fewer approvals. “Point budget” appearing in a call. A competitor mentioned in passing. Health score dropping below 70 for two months running.",
          "Any one of these is noise. Three together is a pattern.",
        ],
      },
      {
        heading: "What to do",
        body: [
          "Book a call within the week and make it about them, not the retainer. Ask what's not working. Write down one thing you will change before the next report.",
          "Then actually change it, and say you did.",
        ],
      },
    ],
  },
];

const CATEGORY_TONE: Record<
  Category,
  "mint" | "peach" | "sky" | "butter" | "lilac"
> = {
  Onboarding: "mint",
  Campaign: "peach",
  Content: "sky",
  Reporting: "lilac",
};

const CATEGORIES: (Category | "All")[] = [
  "All",
  "Onboarding",
  "Campaign",
  "Content",
  "Reporting",
];

/* ------------------------------------------------------------------ */
/* Library                                                             */
/* ------------------------------------------------------------------ */

function PlaybooksLibraryInner() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Category | "All">("All");
  const [selectedId, setSelectedId] = React.useState<string>(
    PLAYBOOKS[0].id,
  );
  const [checked, setChecked] = React.useState<Record<string, boolean>>({
    ob_1: true,
    ob_2: true,
  });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLAYBOOKS.filter((p) => {
      if (category !== "All" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.owner.toLowerCase().includes(q) ||
        p.sections.some((s) =>
          `${s.heading} ${s.body.join(" ")}`.toLowerCase().includes(q),
        )
      );
    });
  }, [query, category]);

  const selected =
    filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  const toggleChecklist = (id: string, value: boolean) => {
    setChecked((prev) => ({ ...prev, [id]: value }));
  };

  const checklistDone = selected?.checklist
    ? selected.checklist.filter((c) => checked[c.id]).length
    : 0;

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="book"
        title="Playbooks"
        description="The agency's shared brain. Read it once, then never again."
      />

      {/* ---------------- filters ---------------- */}
      <Card className="animate-rise">
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <label htmlFor="playbook-search" className="sr-only">
              Search playbooks
            </label>
            <Input
              id="playbook-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search playbooks…"
              className="pl-9"
            />
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter by category"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={cn(
                  "rounded-control px-3 py-1.5 text-xs font-bold transition-colors",
                  category === cat
                    ? "bg-paper-2 text-ink shadow-card"
                    : "bg-paper-3 text-ink-2 hover:text-ink",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="No playbooks match that"
          description="Try a broader search, or maybe it’s time to write the playbook you’re missing."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
          {/* ---------------- list ---------------- */}
          <div className="space-y-3">
            {filtered.map((pb, i) => {
              const active = selected?.id === pb.id;
              return (
                <button
                  key={pb.id}
                  type="button"
                  onClick={() => setSelectedId(pb.id)}
                  aria-pressed={active}
                  className={cn(
                    "animate-rise w-full rounded-card border p-4 text-left transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)]",
                    active
                      ? "border-accent bg-paper-2 shadow-card"
                      : "border-rule bg-paper-2 shadow-card hover:-translate-y-0.5 hover:shadow-card",
                  )}
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-paper-3 text-base"
                      aria-hidden
                    >
                      <Icon name={pb.icon as IconName} className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-sm leading-snug font-bold text-ink">
                        {pb.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge tone={CATEGORY_TONE[pb.category]}>
                          {pb.category}
                        </Badge>
                        <span className="text-[11px] font-bold text-muted">
                          {pb.readMinutes} min read
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ---------------- reading pane ---------------- */}
          {selected && (
            <Card className="animate-rise overflow-hidden">
              <div className="border-b border-rule bg-paper-3/60 px-5 py-4 sm:px-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span aria-hidden className="text-xl">
                        <Icon name={selected.icon as IconName} className="h-5 w-5" />
                      </span>
                      <h2 className="font-display text-xl font-bold text-ink">
                        {selected.title}
                      </h2>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">
                      {selected.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge tone={CATEGORY_TONE[selected.category]}>
                        {selected.category}
                      </Badge>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-muted">
                        <BookOpen className="h-3 w-3" aria-hidden />
                        {selected.owner}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-muted">
                        <Clock className="h-3 w-3" aria-hidden />
                        {selected.readMinutes} min
                      </span>
                      <span className="text-[11px] font-bold text-muted">
                        Updated{" "}
                        {formatRelative(
                          new Date(Date.now() - selected.updatedDaysAgo * 86_400_000),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-6 px-5 py-6 sm:px-7">
                {selected.sections.map((section) => (
                  <section key={section.heading}>
                    <h3 className="font-display text-base font-bold text-ink">
                      {section.heading}
                    </h3>
                    <div className="mt-2 space-y-3">
                      {section.body.map((para, i) => (
                        <p
                          key={i}
                          className="text-sm leading-relaxed text-ink-2"
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </section>
                ))}

                {selected.checklist && (
                  <section className="rounded-card border border-rule bg-paper-3/50 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display text-base font-bold text-ink">
                        Checklist
                      </h3>
                      <span className="text-xs font-bold text-ink-2">
                        {checklistDone} of {selected.checklist.length} done
                      </span>
                    </div>

                    <ul className="mt-4 space-y-2.5">
                      {selected.checklist.map((item) => {
                        const id = `pb-check-${item.id}`;
                        const isChecked = checked[item.id] ?? false;
                        return (
                          <li key={item.id}>
                            <label
                              htmlFor={id}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-control px-2 py-1.5 transition-colors",
                                isChecked ? "opacity-60" : "hover:bg-paper-2",
                              )}
                            >
                              <Checkbox.Root
                                id={id}
                                checked={isChecked}
                                onCheckedChange={(value) =>
                                  toggleChecklist(item.id, value === true)
                                }
                                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-rule bg-paper-2 transition-colors outline-none data-[state=checked]:border-accent data-[state=checked]:bg-paper-3 focus-visible:ring-4 focus-visible:ring-accent/25"
                              >
                                <Checkbox.Indicator className="text-ink">
                                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                </Checkbox.Indicator>
                              </Checkbox.Root>

                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block text-sm font-bold",
                                    isChecked
                                      ? "text-muted line-through"
                                      : "text-ink",
                                  )}
                                >
                                  {item.label}
                                </span>
                                {item.detail && (
                                  <span className="mt-0.5 block text-xs text-muted">
                                    {item.detail}
                                  </span>
                                )}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function PlaybooksLibrary() {
  return <PlaybooksLibraryInner />;
}

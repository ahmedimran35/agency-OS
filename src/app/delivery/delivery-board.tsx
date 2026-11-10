"use client";

import * as React from "react";
import {
  CalendarClock,
  Check,
  CircleAlert,
  Clock,
  Sun,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  SectionHeading,
} from "@/components/ui";
import { ToastProvider, useToast } from "@/components/agency-toast";
import { Icon, type IconName } from "@/components/icons";
import { cn, formatRelative } from "@/lib/utils";
import type { Client } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Mock task data                                                      */
/* ------------------------------------------------------------------ */

type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  clientId: string;
  assignee: string;
  status: TaskStatus;
  priority: Priority;
  /** Days from today. Negative = overdue. */
  dueInDays: number;
  notes?: string;
}

const TASKS: Task[] = [
  {
    id: "tsk_1",
    title: "Ship the oat-hydrate launch carousel",
    clientId: "cli_bee",
    assignee: "Sofia Marin",
    status: "IN_PROGRESS",
    priority: "HIGH",
    dueInDays: 0,
    notes: "8 slides, one per ingredient claim.",
  },
  {
    id: "tsk_2",
    title: "Review the gift guide email series",
    clientId: "cli_north",
    assignee: "Devon Clarke",
    status: "TODO",
    priority: "URGENT",
    dueInDays: -2,
    notes: "Client is chasing this one.",
  },
  {
    id: "tsk_3",
    title: "Publish 4 pages from the keyword map",
    clientId: "cli_lumen",
    assignee: "Priya Raman",
    status: "IN_REVIEW",
    priority: "MEDIUM",
    dueInDays: 1,
  },
  {
    id: "tsk_4",
    title: "Rebuild the class schedule carousel",
    clientId: "cli_fjord",
    assignee: "Ollie Brandt",
    status: "TODO",
    priority: "HIGH",
    dueInDays: 2,
  },
  {
    id: "tsk_5",
    title: "Refresh the author platform homepage",
    clientId: "cli_paper",
    assignee: "Sofia Marin",
    status: "TODO",
    priority: "LOW",
    dueInDays: 6,
  },
  {
    id: "tsk_6",
    title: "Write the “clean beauty” ingredient guide",
    clientId: "cli_bee",
    assignee: "Devon Clarke",
    status: "DONE",
    priority: "MEDIUM",
    dueInDays: -3,
  },
  {
    id: "tsk_7",
    title: "Set up the winter blend announcement",
    clientId: "cli_north",
    assignee: "Imran Ahmed",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    dueInDays: 3,
  },
  {
    id: "tsk_8",
    title: "Collect the Villa Aster project photos",
    clientId: "cli_lumen",
    assignee: "Ollie Brandt",
    status: "DONE",
    priority: "LOW",
    dueInDays: -5,
  },
  {
    id: "tsk_9",
    title: "Draft the February performance recap",
    clientId: "cli_fjord",
    assignee: "Priya Raman",
    status: "IN_REVIEW",
    priority: "HIGH",
    dueInDays: 1,
  },
  {
    id: "tsk_10",
    title: "Plan the Q4 newsletter schedule",
    clientId: "cli_bee",
    assignee: "Imran Ahmed",
    status: "TODO",
    priority: "MEDIUM",
    dueInDays: 4,
  },
];

const STATUS_META: Record<
  TaskStatus,
  { label: string; icon: string; tint: string; dot: string }
> = {
  TODO: {
    label: "To do",
    icon: "document",
    tint: "bg-paper-2",
    dot: "bg-paper-2",
  },
  IN_PROGRESS: {
    label: "In progress",
    icon: "urgent",
    tint: "bg-paper-3",
    dot: "bg-paper-3",
  },
  IN_REVIEW: {
    label: "In review",
    icon: "preview",
    tint: "bg-paper-2",
    dot: "bg-paper-3",
  },
  DONE: {
    label: "Done",
    icon: "check",
    tint: "bg-paper-2",
    dot: "bg-paper-3",
  },
};

const PRIORITY_META: Record<
  Priority,
  { label: string; tone: "neutral" | "sky" | "butter" | "peach" }
> = {
  LOW: { label: "Low", tone: "neutral" },
  MEDIUM: { label: "Medium", tone: "sky" },
  HIGH: { label: "High", tone: "butter" },
  URGENT: { label: "Urgent", tone: "peach" },
};

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];

/* ------------------------------------------------------------------ */
/* Due date helpers                                                    */
/* ------------------------------------------------------------------ */

function dueDate(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

type Urgency = "overdue" | "today" | "soon" | "later" | "done";

function urgencyOf(task: Task): Urgency {
  if (task.status === "DONE") return "done";
  if (task.dueInDays < 0) return "overdue";
  if (task.dueInDays === 0) return "today";
  if (task.dueInDays <= 3) return "soon";
  return "later";
}

const URGENCY_TEXT: Record<Exclude<Urgency, "done">, string> = {
  overdue: "text-danger",
  today: "text-danger",
  soon: "text-warning",
  later: "text-muted",
};

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/* ------------------------------------------------------------------ */
/* Board                                                               */
/* ------------------------------------------------------------------ */

function DeliveryBoardInner({ clients }: { clients: Client[] }) {
  const { toast } = useToast();
  const [tasks, setTasks] = React.useState<Task[]>(TASKS);
  const [clientFilter, setClientFilter] = React.useState("all");

  const clientName = React.useCallback(
    (id: string) => clients.find((c) => c.id === id)?.name ?? "Unknown client",
    [clients],
  );

  const visible = React.useMemo(
    () =>
      clientFilter === "all"
        ? tasks
        : tasks.filter((t) => t.clientId === clientFilter),
    [tasks, clientFilter],
  );

  const byStatus = React.useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of COLUMNS) map.set(col, []);
    for (const task of visible) map.get(task.status)?.push(task);
    for (const list of map.values()) {
      list.sort((a, b) => a.dueInDays - b.dueInDays);
    }
    return map;
  }, [visible]);

  /** "Today’s focus", overdue, due today, and anything in review. */
  const focus = React.useMemo(() => {
    const overdue = visible.filter(
      (t) => t.status !== "DONE" && t.dueInDays < 0,
    );
    const dueToday = visible.filter(
      (t) => t.status !== "DONE" && t.dueInDays === 0,
    );
    const inReview = visible.filter((t) => t.status === "IN_REVIEW");
    return { overdue, dueToday, inReview };
  }, [visible]);

  const advance = (task: Task) => {
    const order: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
    const idx = order.indexOf(task.status);
    if (idx === order.length - 1) return;
    const next = order[idx + 1];
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)),
    );
    toast({
      title: `Moved to ${STATUS_META[next].label.toLowerCase()}`,
      description: task.title,
      tone:
        next === "DONE"
          ? "mint"
          : next === "IN_REVIEW"
            ? "lilac"
            : next === "IN_PROGRESS"
              ? "butter"
              : "sky",
      icon: STATUS_META[next].icon,
    });
  };

  const totalOpen = visible.filter((t) => t.status !== "DONE").length;

  return (
    <div className="space-y-7">
      <SectionHeading
        icon="package"
        title="Project delivery"
        description="What’s moving, what's stuck, and what needs you today."
        action={
          <div className="w-full sm:w-52">
            <label
              htmlFor="delivery-client-filter"
              className="mb-1.5 block text-xs font-bold text-ink-2"
            >
              Filter by client
            </label>
            <select
              id="delivery-client-filter"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* ---------------- today's focus ---------------- */}
      <Card className="animate-rise overflow-hidden">
        <div className="h-1.5 w-full bg-accent" aria-hidden />
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
                <Sun className="h-5 w-5 text-warning" aria-hidden />
                Today’s focus
              </h2>
              <p className="mt-1 text-sm text-ink-2">
                {focus.overdue.length + focus.dueToday.length === 0
                  ? "Nothing is on fire. Suspiciously calm."
                  : `${focus.overdue.length + focus.dueToday.length} task${focus.overdue.length + focus.dueToday.length === 1 ? "" : "s"} want attention, and ${focus.inReview.length} waiting on a thumbs-up.`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {focus.overdue.length > 0 && (
                <Badge tone="peach">
                  <CircleAlert className="h-3 w-3" aria-hidden />
                  {focus.overdue.length} overdue
                </Badge>
              )}
              {focus.dueToday.length > 0 && (
                <Badge tone="butter">
                  <Clock className="h-3 w-3" aria-hidden />
                  {focus.dueToday.length} due today
                </Badge>
              )}
              {focus.inReview.length > 0 && (
                <Badge tone="lilac">
                  {focus.inReview.length} in review
                </Badge>
              )}
              <Badge tone="neutral">{totalOpen} open</Badge>
            </div>
          </div>

          {(focus.overdue.length > 0 || focus.dueToday.length > 0) && (
            <ul className="mt-4 space-y-2">
              {[...focus.overdue, ...focus.dueToday].map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center gap-2 rounded-control bg-paper-3 px-3 py-2"
                >
                  <span
                    className={cn(
                      "text-sm font-bold",
                      task.dueInDays < 0 ? "text-danger" : "text-warning",
                    )}
                  >
                    {task.dueInDays < 0
                      ? `${Math.abs(task.dueInDays)}d late`
                      : "due today"}
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {task.title}
                  </span>
                  <span className="text-xs font-bold text-muted">
                    {clientName(task.clientId)}
                  </span>
                  <span className="ml-auto">
                    <Avatar name={task.assignee} size="sm" />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* ---------------- board ---------------- */}
      {visible.length === 0 ? (
        <EmptyState
          icon="coffee"
          title="Nothing on the board"
          description="No tasks for this client. Either they’re beautifully organised, or somebody forgot to write things down."
        />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max gap-4">
            {COLUMNS.map((col, colIndex) => {
              const meta = STATUS_META[col];
              const list = byStatus.get(col) ?? [];

              return (
                <section
                  key={col}
                  aria-label={`${meta.label} column`}
                  className="animate-rise flex w-[300px] shrink-0 flex-col"
                  style={{ animationDelay: `${colIndex * 60}ms` }}
                >
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-card border border-rule px-3.5 py-2.5",
                      meta.tint,
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon name={meta.icon as IconName} className="h-4 w-4" />
                      <h2 className="font-display text-sm font-bold text-ink">
                        {meta.label}
                      </h2>
                      <Badge tone="neutral" className="bg-paper-2/70">
                        {list.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {list.length === 0 ? (
                      <div className="rounded-card border border-dashed border-rule bg-paper-3/40 px-4 py-8 text-center">
                        <p className="text-sm font-bold text-ink-2">
                          Nothing here yet
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          This column is enjoying the quiet.
                        </p>
                      </div>
                    ) : (
                      list.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          clientName={clientName(task.clientId)}
                          onAdvance={advance}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Task card                                                           */
/* ------------------------------------------------------------------ */

function TaskCard({
  task,
  clientName,
  onAdvance,
}: {
  task: Task;
  clientName: string;
  onAdvance: (task: Task) => void;
}) {
  const urgency = urgencyOf(task);
  const due = dueDate(task.dueInDays);
  const isOpen = task.status !== "DONE";

  return (
    <article
      className={cn(
        "animate-rise rounded-card border border-rule bg-paper-2 p-4 shadow-card transition-[transform,opacity,background-color,border-color,color] duration-[var(--dur-short)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-card",
        urgency === "overdue" && "border-danger/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "font-display text-sm leading-snug font-bold text-ink",
            task.status === "DONE" && "line-through opacity-60",
          )}
        >
          {task.title}
        </h3>
        <Badge
          tone={PRIORITY_META[task.priority].tone}
          className="shrink-0"
        >
          {PRIORITY_META[task.priority].label}
        </Badge>
      </div>

      <p className="mt-1 text-xs font-bold text-ink-2">{clientName}</p>

      {task.notes && (
        <p className="mt-2 text-xs leading-relaxed text-muted">{task.notes}</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-rule pt-3">
        <span
          className={cn(
            "flex items-center gap-1.5 text-[11px] font-bold",
            urgency === "done" ? "text-muted" : URGENCY_TEXT[urgency],
          )}
        >
          {urgency === "done" ? (
            <Check className="h-3 w-3" aria-hidden />
          ) : (
            <CalendarClock className="h-3 w-3" aria-hidden />
          )}
          {urgency === "done"
            ? `Finished ${formatRelative(due)}`
            : `${shortDate.format(due)} · ${formatRelative(due)}`}
        </span>

        <div className="flex items-center gap-2">
          <span title={`Assigned to ${task.assignee}`}>
            <Avatar name={task.assignee} size="sm" />
          </span>
          {isOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAdvance(task)}
              className="text-xs"
            >
              Advance
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-control border border-rule bg-paper-2 px-3.5 pr-9 text-sm text-ink transition-colors hover:border-rule focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15";

export function DeliveryBoard({ clients }: { clients: Client[] }) {
  return (
    <ToastProvider>
      <DeliveryBoardInner clients={clients} />
    </ToastProvider>
  );
}

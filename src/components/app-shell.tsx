"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Handshake,
  Megaphone,
  PenLine,
  FolderKanban,
  Receipt,
  FileBarChart,
  Workflow,
  BookOpen,
  Settings as SettingsIcon,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui";
import { BackgroundField } from "@/components/background-field";

const NAV = [
  { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: Handshake },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/content-studio", label: "Content Studio", icon: PenLine },
  { href: "/delivery", label: "Delivery", icon: FolderKanban },
  { href: "/time-money", label: "Time and money", icon: Receipt },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/playbooks", label: "Playbooks", icon: BookOpen },
];

const SETTINGS_ITEM = {
  href: "/settings",
  label: "Settings",
  icon: SettingsIcon,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // A nav item is current when the path matches it exactly, or when it is a
  // child of it. `/settings` and `/settings/providers` are both under
  // Settings, and Settings itself must light up for both.
  const isCurrent = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex min-h-screen">
      <BackgroundField />

      {/* ---------- Rail ---------- */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-rule bg-paper-2 lg:flex">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 border-b border-rule px-5 py-4"
          aria-label="Brightside, home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-accent-soft">
            <Sprout className="h-5 w-5 text-accent-text" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-extrabold text-ink">
              Brightside
            </span>
            <span className="block text-xs font-bold text-muted">Agency OS</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = isCurrent(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-control px-3 py-2.5",
                  "text-sm font-bold transition-[background-color,color,box-shadow]",
                  "duration-[var(--dur-micro)] ease-[var(--ease-out)]",
                  active
                    ? "bg-accent-soft text-accent-text font-extrabold shadow-card ring-1 ring-accent/25"
                    : "text-ink-2 hover:bg-paper hover:text-ink",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-accent-text" : "text-muted",
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-rule p-3">
          <Link
            href="/settings"
            aria-current={isCurrent("/settings") ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-bold",
              "transition-[background-color,color,box-shadow]",
              "duration-[var(--dur-micro)] ease-[var(--ease-out)]",
              isCurrent("/settings")
                ? "bg-accent-soft text-accent-text font-extrabold shadow-card ring-1 ring-accent/25"
                : "text-ink-2 hover:bg-paper hover:text-ink",
            )}
          >
            <SettingsIcon
              className={cn(
                "h-4 w-4 shrink-0",
                isCurrent("/settings") ? "text-accent-text" : "text-muted",
              )}
              aria-hidden="true"
            />
            Settings
          </Link>
          <div className="mt-2 flex items-center gap-3 rounded-control px-3 py-2">
            <Avatar name="Imran Ahmed" size="sm" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-bold text-ink">
                Imran Ahmed
              </span>
              <span className="block truncate text-xs text-muted">Owner</span>
            </span>
          </div>
        </div>
      </aside>

      {/* ---------- Main column ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-rule bg-paper-2 px-4 py-3 lg:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            aria-label="Brightside, home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-control bg-accent-soft">
              <Sprout className="h-4 w-4 text-accent-text" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-extrabold text-ink">
              Brightside
            </span>
          </Link>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>


        <nav className="flex gap-1 overflow-x-auto border-t border-rule bg-paper-2 px-2 py-2 lg:hidden">
          {[...NAV, SETTINGS_ITEM].map((item) => {
            const active = isCurrent(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-xs font-bold",
                  active
                    ? "bg-accent-soft text-accent-text shadow-card ring-1 ring-accent/25"
                    : "text-ink-2",
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    active ? "text-accent-text" : "text-muted",
                  )}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

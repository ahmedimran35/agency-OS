import { connection } from "next/server";
import { Users } from "lucide-react";
import { getClients, getDashboardData } from "@/lib/data";
import { ClientRoster } from "./roster";

/**
 * The client roster, everyone Brightside looks after, and the doorway to
 * their detail pages.
 */

export const instant = false;

export default async function ClientsPage() {
  await connection();

  const [clients, dashboard] = await Promise.all([
    getClients(),
    getDashboardData(),
  ]);

  const activeCount = clients.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <header className="animate-rise flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control bg-paper-2">
            <Users className="h-6 w-6 text-ink" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">
              Client roster
            </h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-2">
              {clients.length} accounts, {activeCount} of them actively in
              flight. Everyone here has a score, a retainer, and a pulse we
              check on.
            </p>
          </div>
        </div>
      </header>

      <ClientRoster clients={clients} metrics={dashboard.metrics} />
    </div>
  );
}

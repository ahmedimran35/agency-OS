import { connection } from "next/server";
import { getClients, getReports, getDashboardData } from "@/lib/data";
import { ReportsWorkbench } from "./reports-workbench";

/**
 * Client reports, the white-label monthly report generator.
 *
 * Reads the request clock so generated periods and "sent 3 days ago" copy
 * are accurate per visit.
 */
export const instant = false;

export default async function ReportsPage() {
  await connection();

  const [clients, reports, dashboard] = await Promise.all([
    getClients(),
    getReports(),
    getDashboardData(),
  ]);

  return (
    <ReportsWorkbench
      clients={clients}
      reports={reports}
      metrics={dashboard.metrics}
      agencyName={dashboard.agencyName}
    />
  );
}

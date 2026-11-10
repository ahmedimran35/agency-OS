import { connection } from "next/server";
import { getClients } from "@/lib/data";
import { TimeMoney } from "./time-money";

/**
 * Time & money, retainers, hours, invoices.
 *
 * Reads the request clock so invoice due dates and hour comparisons are
 * relative to today.
 */
export const instant = false;

export default async function TimeMoneyPage() {
  await connection();

  const clients = await getClients();

  return <TimeMoney clients={clients} />;
}

import { connection } from "next/server";
import { getClients } from "@/lib/data";
import { AutomationsRegistry } from "./automations-registry";

/**
 * Automations, the workflow recipe registry.
 *
 * Reads the request clock so "last run" times stay honest.
 */
export const instant = false;

export default async function AutomationsPage() {
  await connection();

  const clients = await getClients();

  return <AutomationsRegistry clients={clients} />;
}

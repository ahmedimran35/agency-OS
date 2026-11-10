import { connection } from "next/server";
import { getClients, getDeals } from "@/lib/data";
import { PipelineBoard } from "./pipeline-board";

/**
 * CRM Pipeline, a Kanban board of deals across the six sales stages.
 *
 * The route opts out of instant-navigation validation and reads the request
 * clock, because deal cards render relative close dates ("closes in 3 weeks")
 * and the shared `formatRelative` helper reads the current time.
 */
export const instant = false;

export default async function PipelinePage() {
  await connection();

  const [clients, deals] = await Promise.all([getClients(), getDeals()]);

  return <PipelineBoard clients={clients} initialDeals={deals} />;
}

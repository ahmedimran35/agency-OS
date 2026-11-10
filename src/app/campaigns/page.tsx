import { connection } from "next/server";
import { getCampaigns, getClients, getContent } from "@/lib/data";
import { CampaignPlanner } from "./campaign-planner";

/**
 * Campaign planner, channel planner with a month calendar.
 *
 * Reads the request clock so campaigns can show "starts in 3 days" and the
 * calendar can highlight today.
 */
export const instant = false;

export default async function CampaignsPage() {
  await connection();

  const [campaigns, clients, content] = await Promise.all([
    getCampaigns(),
    getClients(),
    getContent(),
  ]);

  return (
    <CampaignPlanner
      campaigns={campaigns}
      clients={clients}
      content={content}
    />
  );
}

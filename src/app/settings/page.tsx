import { connection } from "next/server";
import { SettingsWorkbench } from "./settings-workbench";

/**
 * Settings, agency, team, integrations, billing and AI.
 *
 * Reads the request clock so "renews in N days" style copy stays accurate.
 */
export const instant = false;

export default async function SettingsPage() {
  await connection();

  return <SettingsWorkbench />;
}

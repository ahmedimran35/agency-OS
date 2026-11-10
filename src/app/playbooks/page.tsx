import { connection } from "next/server";
import { PlaybooksLibrary } from "./playbooks-library";

/**
 * Playbooks, the agency's SOP knowledge base.
 *
 * Reads the request clock so "last updated" is relative to today.
 */
export const instant = false;

export default async function PlaybooksPage() {
  await connection();

  return <PlaybooksLibrary />;
}

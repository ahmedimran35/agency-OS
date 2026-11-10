import { connection } from "next/server";
import { getClients } from "@/lib/data";
import { DeliveryBoard } from "./delivery-board";

/**
 * Project delivery, the task board.
 *
 * Reads the request clock so due dates can be compared against today.
 */
export const instant = false;

export default async function DeliveryPage() {
  await connection();

  const clients = await getClients();

  return <DeliveryBoard clients={clients} />;
}

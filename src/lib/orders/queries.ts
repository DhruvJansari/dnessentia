import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, orderEvents, orders } from "@/db";
import { getSessionUser, isStaff } from "../auth/session";
import { isValidOrderKey } from "./access";

/**
 * Loads an order for the customer-facing order page.
 * Allowed with the signed link from the email, for the account that owns it, or for staff.
 */
export async function getViewableOrder(orderNumber: string, key: string | undefined) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber.toUpperCase()),
    with: { items: true },
  });
  if (!order) return null;
  const user = await getSessionUser();
  const allowed = isValidOrderKey(order.orderNumber, key) || (user && (user.id === order.userId || isStaff(user)));
  if (!allowed) return null;
  const events = await db
    .select()
    .from(orderEvents)
    .where(and(eq(orderEvents.orderId, order.id), eq(orderEvents.isInternal, false)))
    .orderBy(asc(orderEvents.createdAt), asc(orderEvents.id));
  // "Thank you" framing only for orders placed in the last 30 minutes.
  const isFresh = Date.now() - order.createdAt.getTime() < 30 * 60e3;
  return { order, events, user, isFresh };
}

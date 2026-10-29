import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db, orderEvents, orders } from "@/db";
import { getSessionUser, isStaff } from "../auth/session";
import { getSettings } from "../settings";
import { isValidOrderKey, orderAccessKey } from "./access";
import { cancellationQuote, getReplacementRequests, replacementWindowOpen } from "./after-sales";

const deadlineFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

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
  const [events, settings, replacements] = await Promise.all([
    db
      .select()
      .from(orderEvents)
      .where(and(eq(orderEvents.orderId, order.id), eq(orderEvents.isInternal, false)))
      .orderBy(asc(orderEvents.createdAt), asc(orderEvents.id)),
    getSettings(),
    getReplacementRequests(order.id),
  ]);
  const now = Date.now();
  const cancel = cancellationQuote(order, settings.policies, now);
  const openRequest = replacements.find((r) => r.status === "requested" || r.status === "approved");

  return {
    order,
    events,
    user,
    accessKey: orderAccessKey(order.orderNumber),
    // "Thank you" framing only for orders placed in the last 30 minutes.
    isFresh: now - order.createdAt.getTime() < 30 * 60e3,
    afterSales: {
      cancel: cancel.allowed
        ? {
            charge: cancel.charge,
            refund: cancel.refund,
            prepaid: order.paymentStatus === "paid",
            chargePercent: settings.policies.cancellationChargePercent,
            deadline: cancel.deadline ? deadlineFmt.format(cancel.deadline) : null,
          }
        : null,
      replacement: {
        canRequest: !openRequest && replacementWindowOpen(order, settings.policies, now),
        windowDays: settings.policies.replacementWindowDays,
        requests: replacements,
      },
      hasInvoice: Boolean(order.invoiceNumber),
    },
  };
}

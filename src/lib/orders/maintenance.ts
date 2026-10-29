import "server-only";
import { and, asc, eq, inArray, isNotNull, isNull, lt } from "drizzle-orm";
import { db, orders } from "@/db";
import { integrations } from "../env";
import { sendMail } from "../mail/send";
import { paymentReminderTemplate } from "../mail/templates";
import { getSettings } from "../settings";
import { orderUrl } from "./access";
import { changeOrderStatus, errorText, reconcileRazorpayPayment, syncTracking } from "./service";

/** Shipped orders whose courier status is pulled per run. Oldest-updated first, so every order gets its turn. */
const TRACKING_BATCH = 40;

/**
 * Housekeeping. Runs every ~15 minutes (built-in timer in production, /api/cron/maintenance, or the "Run now"
 * button in Admin → Settings). Safe to run as often as you like. It does not depend on webhooks:
 * - confirms online orders that were paid but never confirmed by the browser (asks Razorpay directly),
 * - reminds and then cancels orders that are still unpaid,
 * - pulls courier status from Shiprocket and marks parcels delivered.
 */
export async function runMaintenance() {
  const { policies } = await getSettings();
  const now = Date.now();
  const unpaid = and(eq(orders.status, "pending"), eq(orders.paymentMethod, "razorpay"), eq(orders.paymentStatus, "unpaid"));
  const result = { confirmed: 0, reminded: 0, expired: 0, tracked: 0, errors: [] as string[] };

  // Payments first, so nobody who already paid gets a reminder or a cancellation.
  const open = await db
    .select()
    .from(orders)
    .where(and(eq(orders.status, "pending"), eq(orders.paymentMethod, "razorpay"), inArray(orders.paymentStatus, ["unpaid", "failed"]), isNotNull(orders.razorpayOrderId)));
  for (const o of open) {
    try {
      if (await reconcileRazorpayPayment(o, { type: "system" })) result.confirmed++;
    } catch (err) {
      result.errors.push(`${o.orderNumber}: payment check failed: ${errorText(err)}`);
    }
  }

  const expireBefore = new Date(now - policies.pendingPaymentExpiryHours * 3600e3);
  const stale = await db.select().from(orders).where(and(unpaid, lt(orders.createdAt, expireBefore)));
  for (const o of stale) {
    try {
      await changeOrderStatus(o.id, "cancelled", { type: "system" }, `Payment not completed within ${policies.pendingPaymentExpiryHours} hours`);
      result.expired++;
    } catch (err) {
      result.errors.push(`${o.orderNumber}: ${errorText(err)}`);
    }
  }

  const remindBefore = new Date(now - policies.paymentReminderAfterHours * 3600e3);
  const waiting = await db
    .select()
    .from(orders)
    .where(and(unpaid, lt(orders.createdAt, remindBefore), isNull(orders.paymentReminderSentAt)));
  for (const o of waiting) {
    await sendMail({
      ...paymentReminderTemplate(o, orderUrl(o.orderNumber), policies.pendingPaymentExpiryHours),
      to: o.email,
      template: "payment_reminder",
      orderId: o.id,
      userId: o.userId,
    });
    await db.update(orders).set({ paymentReminderSentAt: new Date() }).where(eq(orders.id, o.id));
    result.reminded++;
  }

  if (integrations.shiprocket()) {
    const inTransit = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber })
      .from(orders)
      .where(and(eq(orders.status, "shipped"), isNotNull(orders.awbCode)))
      .orderBy(asc(orders.updatedAt))
      .limit(TRACKING_BATCH);
    for (const o of inTransit) {
      try {
        await syncTracking(o.id, { type: "system" });
        result.tracked++;
      } catch (err) {
        result.errors.push(`${o.orderNumber}: tracking sync failed: ${errorText(err)}`);
      }
    }
  }
  return result;
}

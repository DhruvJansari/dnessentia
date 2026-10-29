import "server-only";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db, orders } from "@/db";
import { sendMail } from "../mail/send";
import { paymentReminderTemplate } from "../mail/templates";
import { getSettings } from "../settings";
import { orderUrl } from "./access";
import { changeOrderStatus, errorText } from "./service";

/**
 * Housekeeping for unpaid online orders. Runs from /api/cron/maintenance (every ~15 minutes) and from the
 * "Run now" button in Admin → Settings. Safe to run as often as you like.
 */
export async function runMaintenance() {
  const { policies } = await getSettings();
  const now = Date.now();
  const unpaid = and(eq(orders.status, "pending"), eq(orders.paymentMethod, "razorpay"), eq(orders.paymentStatus, "unpaid"));
  const result = { reminded: 0, expired: 0, errors: [] as string[] };

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
  return result;
}

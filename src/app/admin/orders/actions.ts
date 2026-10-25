"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { orderStatuses } from "@/db/schema";
import { audit, orderEvent } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";
import {
  changeOrderStatus,
  createShipment,
  errorText,
  getOrderWithItems,
  refundOrder,
  resendOrderEmail,
  syncTracking,
} from "@/lib/orders/service";

export type ActionResult = { ok: boolean; message: string };

async function run(orderId: number, fn: () => Promise<string>): Promise<ActionResult> {
  try {
    const message = await fn();
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { ok: true, message };
  } catch (err) {
    return { ok: false, message: errorText(err) };
  }
}

const statusSchema = z.object({ orderId: z.number().int(), status: z.enum(orderStatuses), note: z.string().max(300).optional() });

export async function updateStatusAction(input: z.input<typeof statusSchema>) {
  const user = await requireStaff();
  const { orderId, status, note } = statusSchema.parse(input);
  return run(orderId, async () => {
    const before = await getOrderWithItems(orderId);
    await changeOrderStatus(orderId, status, { type: "admin", id: user.id }, note || null);
    await audit({
      actor: user,
      action: "order.status",
      entityType: "order",
      entityId: orderId,
      summary: `${before.orderNumber}: ${before.status} → ${status}`,
      changes: { status: { from: before.status, to: status }, note: note ?? null },
    });
    return `Order marked as ${status}.`;
  });
}

export async function addNoteAction(input: { orderId: number; note: string; internal: boolean }) {
  const user = await requireStaff();
  const note = input.note.trim().slice(0, 500);
  if (!note) return { ok: false, message: "Write a note first." };
  return run(input.orderId, async () => {
    await orderEvent({
      orderId: input.orderId,
      type: "note",
      message: note,
      actorType: "admin",
      actorId: user.id,
      isInternal: input.internal,
    });
    return input.internal ? "Internal note added." : "Note added and visible to the customer.";
  });
}

export async function createShipmentAction(orderId: number) {
  const user = await requireStaff();
  return run(orderId, async () => {
    const order = await createShipment(orderId, { type: "admin", id: user.id });
    await audit({
      actor: user,
      action: "order.ship",
      entityType: "order",
      entityId: orderId,
      summary: `${order.orderNumber}: shipped via Shiprocket (AWB ${order.awbCode ?? "pending"})`,
    });
    return `Shipment created. AWB ${order.awbCode ?? "pending"}.`;
  });
}

export async function syncTrackingAction(orderId: number) {
  const user = await requireStaff();
  return run(orderId, async () => {
    const t = await syncTracking(orderId, { type: "admin", id: user.id });
    return `Courier status: ${t.currentStatus ?? "no update yet"}.`;
  });
}

export async function refundAction(orderId: number) {
  const user = await requireStaff();
  if (user.role !== "admin") return { ok: false, message: "Only admins can issue refunds." };
  return run(orderId, async () => {
    const order = await getOrderWithItems(orderId);
    await refundOrder(orderId, { type: "admin", id: user.id });
    await audit({ actor: user, action: "order.refund", entityType: "order", entityId: orderId, summary: `${order.orderNumber}: refunded ₹${order.total}` });
    return "Refund issued through Razorpay.";
  });
}

export async function resendEmailAction(orderId: number, kind: "confirmation" | "shipped" | "delivered" | "cancelled") {
  const user = await requireStaff();
  return run(orderId, async () => {
    const status = await resendOrderEmail(orderId, kind);
    await audit({ actor: user, action: "order.email", entityType: "order", entityId: orderId, summary: `Resent ${kind} email (${status})` });
    return status === "sent" ? "Email sent." : status === "skipped" ? "SMTP isn't configured; the email was logged instead." : "Email failed. See Emails for details.";
  });
}

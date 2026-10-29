import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { db, orderItems, orders, productVariants, replacementRequests, type ReplacementItem } from "@/db";
import { orderEvent } from "../audit";
import { sendMail } from "../mail/send";
import {
  adminAlertTemplate,
  replacementDecisionTemplate,
  replacementReasonLabel,
  replacementReceivedTemplate,
} from "../mail/templates";
import { getSettings } from "../settings";
import type { StoreSettings } from "../settings-defaults";
import { adminOrderUrl, orderUrl } from "./access";
import { changeOrderStatus, getOrderWithItems, refundOrder, type OrderRow } from "./service";

type Actor = { type: "system" | "customer" | "admin" | "webhook"; id?: number | null };

/* ------------------------------ Cancellation ------------------------------ */

export type CancellationQuote = { allowed: boolean; reason?: string; charge: number; refund: number; deadline: Date | null };

/**
 * Customer self-cancellation rules: before dispatch, within the policy window. Prepaid orders keep the
 * cancellation charge (50% by default) and refund the rest; unpaid and COD orders cancel at no cost.
 */
export function cancellationQuote(order: OrderRow, policies: StoreSettings["policies"], now: number): CancellationQuote {
  const deadline = new Date(order.createdAt.getTime() + policies.cancellationWindowHours * 3600e3);
  const no = (reason: string): CancellationQuote => ({ allowed: false, reason, charge: 0, refund: 0, deadline });
  if (order.kind !== "standard") return no("Replacement orders can't be cancelled.");
  if (!["pending", "confirmed", "processing"].includes(order.status)) return no("This order can no longer be cancelled.");
  if (order.awbCode) return no("Your order has already been handed to the courier.");
  const unpaid = order.paymentStatus !== "paid";
  if (!unpaid && now > deadline.getTime()) return no(`Orders can be cancelled within ${policies.cancellationWindowHours} hours of purchase.`);
  if (order.paymentMethod === "cod" && now > deadline.getTime()) return no(`Orders can be cancelled within ${policies.cancellationWindowHours} hours of purchase.`);
  if (unpaid) return { allowed: true, charge: 0, refund: 0, deadline };
  const charge = Math.round((order.total * policies.cancellationChargePercent) / 100);
  return { allowed: true, charge, refund: order.total - charge, deadline };
}

export async function cancelByCustomer(orderId: number, reason: string, actor: Actor) {
  const order = await getOrderWithItems(orderId);
  const { policies } = await getSettings();
  const quote = cancellationQuote(order, policies, Date.now());
  if (!quote.allowed) throw new Error(quote.reason ?? "This order can't be cancelled.");

  await db
    .update(orders)
    .set({ cancellationCharge: quote.charge, cancelReason: reason.slice(0, 255) || null })
    .where(eq(orders.id, orderId));
  // Refund first: if Razorpay refuses, the order stays active and the customer sees the error.
  if (quote.refund > 0) await refundOrder(orderId, actor, quote.refund);
  if (quote.charge > 0) {
    await orderEvent({
      orderId,
      type: "payment",
      message: `Cancellation charge of ₹${quote.charge} kept (${policies.cancellationChargePercent}% as per policy)`,
      actorType: "system",
    });
  }
  return changeOrderStatus(orderId, "cancelled", actor, reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer");
}

/* ------------------------------ Replacements ------------------------------ */

export function replacementWindowOpen(order: OrderRow, policies: StoreSettings["policies"], now: number) {
  if (order.kind !== "standard" || order.status !== "delivered" || !order.deliveredAt) return false;
  return now - order.deliveredAt.getTime() <= policies.replacementWindowDays * 864e5;
}

export async function getReplacementRequests(orderId: number) {
  return db.select().from(replacementRequests).where(eq(replacementRequests.orderId, orderId)).orderBy(desc(replacementRequests.createdAt));
}

export async function createReplacementRequest(input: {
  orderId: number;
  userId: number | null;
  items: ReplacementItem[];
  reason: (typeof replacementRequests.$inferInsert)["reason"];
  details: string;
  photos: string[];
  videoUrl: string | null;
}) {
  const order = await getOrderWithItems(input.orderId);
  const { policies, notifications } = await getSettings();
  if (!replacementWindowOpen(order, policies, Date.now())) {
    throw new Error(`Replacements can be requested within ${policies.replacementWindowDays} days of delivery.`);
  }
  const open = (await getReplacementRequests(order.id)).find((r) => r.status === "requested" || r.status === "approved");
  if (open) throw new Error("There's already a replacement request open for this order.");

  const validIds = new Map(order.items.filter((i) => !i.isGift).map((i) => [i.id, i.quantity]));
  const items = input.items
    .filter((i) => validIds.has(i.orderItemId))
    .map((i) => ({ orderItemId: i.orderItemId, quantity: Math.min(Math.max(1, i.quantity), validIds.get(i.orderItemId)!) }));
  if (items.length === 0) throw new Error("Choose at least one product to replace.");

  const [res] = await db.insert(replacementRequests).values({ ...input, items });
  await orderEvent({
    orderId: order.id,
    type: "note",
    message: `Replacement requested: ${replacementReasonLabel(input.reason)}`,
    actorType: "customer",
    actorId: input.userId,
  });
  await sendMail({ ...replacementReceivedTemplate(order, input.reason, orderUrl(order.orderNumber)), to: order.email, template: "replacement_received", orderId: order.id, userId: order.userId });
  if (notifications.adminEmail) {
    await sendMail({
      ...adminAlertTemplate(
        `Replacement request for ${order.orderNumber}`,
        [`${order.customerName} (${order.email})`, `Reason: ${replacementReasonLabel(input.reason)}`, input.details, input.videoUrl ? `Video: ${input.videoUrl}` : ""].filter(Boolean),
        `${adminOrderUrl(order.id)}`,
      ),
      to: notifications.adminEmail,
      template: "admin_replacement",
      orderId: order.id,
    });
  }
  return res.insertId;
}

/**
 * Approving creates a free replacement order (₹0, kind "replacement") with the selected items, which then
 * ships like any other order. The customer covers no product cost; delivery/packaging are not refunded.
 */
export async function decideReplacement(requestId: number, approve: boolean, note: string | null, actor: Actor) {
  const req = await db.query.replacementRequests.findFirst({ where: eq(replacementRequests.id, requestId) });
  if (!req || req.status !== "requested") throw new Error("This request has already been handled.");
  const order = await getOrderWithItems(req.orderId);

  let replacementOrderId: number | null = null;
  if (approve) {
    const byId = new Map(order.items.map((i) => [i.id, i]));
    const lines = req.items.map((r) => ({ item: byId.get(r.orderItemId)!, qty: r.quantity })).filter((l) => l.item);
    replacementOrderId = await db.transaction(async (tx) => {
      const [res] = await tx.insert(orders).values({
        orderNumber: `R${Date.now().toString(36)}`,
        accessTokenHash: "",
        kind: "replacement",
        parentOrderId: order.id,
        userId: order.userId,
        email: order.email,
        phone: order.phone,
        customerName: order.customerName,
        shipLine1: order.shipLine1,
        shipLine2: order.shipLine2,
        shipCity: order.shipCity,
        shipState: order.shipState,
        shipPincode: order.shipPincode,
        status: "confirmed",
        paymentStatus: "paid",
        paymentMethod: order.paymentMethod,
        subtotal: 0,
        total: 0,
        customerNote: `Replacement for ${order.orderNumber}`,
      });
      const id = res.insertId;
      await tx.update(orders).set({ orderNumber: `DN${10000 + id}` }).where(eq(orders.id, id));
      await tx.insert(orderItems).values(
        lines.map(({ item, qty }) => ({
          orderId: id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          variantLabel: item.variantLabel,
          sku: item.sku,
          image: item.image,
          // Original price kept as the declared value for the courier; the customer pays nothing.
          unitPrice: item.unitPrice,
          quantity: qty,
          lineTotal: 0,
          selections: item.selections,
        })),
      );
      return id;
    });
    // Replacement stock leaves the warehouse too.
    const created = await getOrderWithItems(replacementOrderId);
    for (const i of created.items) {
      const v = await db.query.productVariants.findFirst({ where: eq(productVariants.id, i.variantId) });
      if (v) await db.update(productVariants).set({ stock: Math.max(0, v.stock - i.quantity) }).where(eq(productVariants.id, v.id));
    }
    await db.update(orders).set({ stockDeducted: true }).where(eq(orders.id, replacementOrderId));
    await orderEvent({ orderId: replacementOrderId, type: "created", message: `Replacement order created for ${order.orderNumber}`, actorType: actor.type, actorId: actor.id });
    await orderEvent({ orderId: order.id, type: "note", message: `Replacement approved. New order ${created.orderNumber} will be shipped.`, actorType: actor.type, actorId: actor.id });
  } else {
    await orderEvent({ orderId: order.id, type: "note", message: `Replacement request declined${note ? `: ${note}` : ""}`, actorType: actor.type, actorId: actor.id });
  }

  await db
    .update(replacementRequests)
    .set({
      status: approve ? "approved" : "rejected",
      adminNote: note,
      replacementOrderId,
      decidedBy: actor.id ?? null,
      decidedAt: new Date(),
    })
    .where(eq(replacementRequests.id, requestId));
  await sendMail({
    ...replacementDecisionTemplate(order, approve, note, orderUrl(order.orderNumber)),
    to: order.email,
    template: approve ? "replacement_approved" : "replacement_rejected",
    orderId: order.id,
    userId: order.userId,
  });
  return replacementOrderId;
}

export async function listOpenReplacements() {
  const rows = await db.select().from(replacementRequests).where(inArray(replacementRequests.status, ["requested", "approved"])).orderBy(desc(replacementRequests.createdAt));
  return rows;
}


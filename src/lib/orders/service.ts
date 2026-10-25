import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { coupons, db, orderItems, orders, payments, productVariants, type OrderStatus } from "@/db";
import { orderEvent } from "../audit";
import { integrations } from "../env";
import { sendMail } from "../mail/send";
import {
  adminNewOrderTemplate,
  orderCancelledTemplate,
  orderConfirmationTemplate,
  orderDeliveredTemplate,
  orderShippedTemplate,
} from "../mail/templates";
import { createRazorpayOrder, refundPayment } from "../razorpay";
import { getSettings } from "../settings";
import {
  assignAwb,
  cancelShiprocketOrder,
  createShiprocketOrder,
  publicTrackingUrl,
  requestPickup,
  trackAwb,
} from "../shiprocket";
import { hashToken } from "../tokens";
import { adminOrderUrl, orderAccessKey, orderUrl } from "./access";
import type { Quote } from "./pricing";

type Actor = { type: "system" | "customer" | "admin" | "webhook"; id?: number | null };
export type OrderRow = typeof orders.$inferSelect;

export async function getOrderWithItems(orderId: number) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), with: { items: true } });
  if (!order) throw new Error(`Order ${orderId} not found`);
  return order;
}

/* ------------------------------- Placement -------------------------------- */

export type NewOrderInput = {
  quote: Quote;
  userId: number | null;
  email: string;
  phone: string;
  customerName: string;
  address: { line1: string; line2?: string | null; city: string; state: string; pincode: string };
  paymentMethod: "razorpay" | "cod";
  customerNote?: string | null;
  ip?: string | null;
};

/** Writes the order and its lines. Online orders stay "pending/unpaid" until Razorpay confirms payment. */
export async function createOrder(input: NewOrderInput) {
  const { quote } = input;
  const orderId = await db.transaction(async (tx) => {
    const [res] = await tx.insert(orders).values({
      // Placeholder until the auto-increment id is known; replaced with DN<10000+id> in the same transaction.
      orderNumber: `T${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      accessTokenHash: "",
      userId: input.userId,
      email: input.email,
      phone: input.phone,
      customerName: input.customerName,
      shipLine1: input.address.line1,
      shipLine2: input.address.line2 || null,
      shipCity: input.address.city,
      shipState: input.address.state,
      shipPincode: input.address.pincode,
      paymentMethod: input.paymentMethod,
      status: "pending",
      paymentStatus: "unpaid",
      subtotal: quote.subtotal,
      discount: quote.discount,
      shippingFee: quote.shippingFee,
      codFee: quote.codFee,
      total: quote.total,
      couponCode: quote.coupon?.code ?? null,
      giftNote: quote.giftNote,
      customerNote: input.customerNote || null,
      ip: input.ip ?? null,
    });
    const id = res.insertId;
    const orderNumber = `DN${10000 + id}`;
    await tx
      .update(orders)
      .set({ orderNumber, accessTokenHash: hashToken(orderAccessKey(orderNumber)) })
      .where(eq(orders.id, id));
    await tx.insert(orderItems).values(
      quote.lines.map((l) => ({
        orderId: id,
        productId: l.productId,
        variantId: l.variantId,
        name: l.name,
        variantLabel: l.variantLabel,
        sku: l.sku,
        image: l.image,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
        selections: l.selections,
      })),
    );
    return id;
  });

  await orderEvent({
    orderId,
    type: "created",
    message: `Order placed by ${input.customerName} (${input.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"})`,
    data: { total: quote.total, coupon: quote.coupon?.code ?? null },
    actorType: "customer",
    actorId: input.userId,
  });

  if (input.paymentMethod === "cod") {
    await confirmOrder(orderId, { type: "system" }, "Confirmed as Cash on Delivery");
  }
  return getOrderWithItems(orderId);
}

/** Creates (or re-creates) the Razorpay order the browser checkout opens. */
export async function startRazorpayPayment(order: OrderRow) {
  const rzp = await createRazorpayOrder(order.total, order.orderNumber, {
    order_number: order.orderNumber,
    email: order.email,
  });
  await db.update(orders).set({ razorpayOrderId: rzp.id }).where(eq(orders.id, order.id));
  await db.insert(payments).values({
    orderId: order.id,
    provider: "razorpay",
    providerOrderId: rzp.id,
    amount: order.total,
    status: "created",
  });
  await orderEvent({ orderId: order.id, type: "payment", message: `Razorpay payment started (${rzp.id})`, data: { razorpayOrderId: rzp.id } });
  return rzp;
}

/* ------------------------------ Confirmation ------------------------------ */

async function deductStock(orderId: number) {
  const order = await getOrderWithItems(orderId);
  if (order.stockDeducted) return;
  const short: string[] = [];
  for (const item of order.items) {
    const [res] = await db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
      .where(and(eq(productVariants.id, item.variantId), sql`${productVariants.stock} >= ${item.quantity}`));
    if (res.affectedRows === 0) {
      await db.update(productVariants).set({ stock: 0 }).where(eq(productVariants.id, item.variantId));
      short.push(`${item.name} ${item.variantLabel}`);
    }
  }
  await db.update(orders).set({ stockDeducted: true }).where(eq(orders.id, orderId));
  await orderEvent({
    orderId,
    type: "stock",
    message: short.length ? `Stock deducted. Oversold: ${short.join(", ")}` : "Stock deducted",
    isInternal: true,
  });
}

async function restoreStock(orderId: number) {
  const order = await getOrderWithItems(orderId);
  if (!order.stockDeducted) return;
  for (const item of order.items) {
    await db
      .update(productVariants)
      .set({ stock: sql`${productVariants.stock} + ${item.quantity}` })
      .where(eq(productVariants.id, item.variantId));
  }
  await db.update(orders).set({ stockDeducted: false }).where(eq(orders.id, orderId));
  await orderEvent({ orderId, type: "stock", message: "Stock returned to inventory", isInternal: true });
}

/** Pending → confirmed: deduct stock, count the coupon, email customer + admin, optionally push to Shiprocket. */
async function confirmOrder(orderId: number, actor: Actor, message: string) {
  const [res] = await db
    .update(orders)
    .set({ status: "confirmed" })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending")));
  if (res.affectedRows === 0) return; // already confirmed by another path (webhook vs browser)

  await orderEvent({ orderId, type: "status", message, actorType: actor.type, actorId: actor.id });
  await deductStock(orderId);

  const order = await getOrderWithItems(orderId);
  if (order.couponCode) {
    await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.code, order.couponCode));
  }

  const settings = await getSettings();
  const confirmation = orderConfirmationTemplate(order, order.items, orderUrl(order.orderNumber));
  await emailForOrder(order, order.email, confirmation, "order_confirmation");
  if (settings.notifications.notifyOnNewOrder && settings.notifications.adminEmail) {
    const alert = adminNewOrderTemplate(order, order.items, adminOrderUrl(order.id));
    await emailForOrder(order, settings.notifications.adminEmail, alert, "admin_new_order", true);
  }

  if (settings.fulfilment.autoCreateShipment && integrations.shiprocket()) {
    await createShipment(orderId, { type: "system" }).catch((err) =>
      orderEvent({ orderId, type: "shipment", message: `Automatic Shiprocket push failed: ${errorText(err)}`, isInternal: true }),
    );
  }
}

/** Idempotent: safe to call from both the browser callback and the Razorpay webhook. */
export async function markOrderPaid(
  orderId: number,
  payment: { razorpayOrderId: string; razorpayPaymentId: string; method?: string | null; raw?: Record<string, unknown> },
  actor: Actor,
) {
  const [res] = await db
    .update(orders)
    .set({ paymentStatus: "paid", paidAt: new Date(), razorpayPaymentId: payment.razorpayPaymentId })
    .where(and(eq(orders.id, orderId), sql`${orders.paymentStatus} <> 'paid'`));
  if (res.affectedRows === 0) return false;

  const order = await getOrderWithItems(orderId);
  await db
    .update(payments)
    .set({ status: "captured", providerPaymentId: payment.razorpayPaymentId, method: payment.method ?? null, raw: payment.raw ?? null })
    .where(and(eq(payments.orderId, orderId), eq(payments.providerOrderId, payment.razorpayOrderId)));
  await orderEvent({
    orderId,
    type: "payment",
    message: `Payment of ₹${order.total} received via Razorpay${payment.method ? ` (${payment.method})` : ""}`,
    data: { razorpayPaymentId: payment.razorpayPaymentId },
    actorType: actor.type,
    actorId: actor.id,
  });

  if (order.status === "cancelled") {
    // Paid after the order was cancelled (e.g. a late webhook). Flag it so staff can refund.
    await orderEvent({ orderId, type: "note", message: "Payment arrived for a cancelled order. Refund required.", isInternal: true });
    return true;
  }
  await confirmOrder(orderId, actor, "Order confirmed after successful payment");
  return true;
}

export async function markPaymentFailed(orderId: number, reason: string, actor: Actor) {
  await db
    .update(orders)
    .set({ paymentStatus: "failed" })
    .where(and(eq(orders.id, orderId), eq(orders.paymentStatus, "unpaid")));
  await orderEvent({ orderId, type: "payment", message: `Payment failed: ${reason}`.slice(0, 500), actorType: actor.type, actorId: actor.id });
}

/* ------------------------------ Status changes ----------------------------- */

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export function nextStatuses(status: OrderStatus) {
  return allowedTransitions[status];
}

export async function changeOrderStatus(orderId: number, to: OrderStatus, actor: Actor, note?: string | null) {
  const order = await getOrderWithItems(orderId);
  if (order.status === to) return order;
  if (!allowedTransitions[order.status].includes(to)) {
    throw new Error(`An order can't go from ${order.status} to ${to}.`);
  }

  const stamp: Partial<OrderRow> = {};
  if (to === "shipped") stamp.shippedAt = new Date();
  if (to === "delivered") {
    stamp.deliveredAt = new Date();
    if (order.paymentMethod === "cod" && order.paymentStatus !== "paid") {
      stamp.paymentStatus = "paid";
      stamp.paidAt = new Date();
    }
  }
  if (to === "cancelled") stamp.cancelledAt = new Date();

  await db.update(orders).set({ status: to, ...stamp }).where(eq(orders.id, orderId));
  await orderEvent({
    orderId,
    type: "status",
    message: `Status changed from ${order.status} to ${to}${note ? `: ${note}` : ""}`,
    actorType: actor.type,
    actorId: actor.id,
  });
  if (stamp.paymentStatus === "paid") {
    await orderEvent({ orderId, type: "payment", message: `Cash on Delivery collected (₹${order.total})`, actorType: actor.type, actorId: actor.id });
  }

  if (to === "confirmed") {
    await deductStock(orderId);
  }
  if (to === "cancelled" || to === "returned") {
    await restoreStock(orderId);
    if (order.shiprocketOrderId && to === "cancelled") {
      await cancelShiprocketOrder(order.shiprocketOrderId)
        .then(() => orderEvent({ orderId, type: "shipment", message: "Shiprocket order cancelled" }))
        .catch((err) => orderEvent({ orderId, type: "shipment", message: `Shiprocket cancel failed: ${errorText(err)}`, isInternal: true }));
    }
  }

  const updated = await getOrderWithItems(orderId);
  const link = orderUrl(updated.orderNumber);
  if (to === "shipped") {
    await emailForOrder(updated, updated.email, orderShippedTemplate(updated, link, updated.awbCode ? publicTrackingUrl(updated.awbCode) : null), "order_shipped");
  } else if (to === "delivered") {
    await emailForOrder(updated, updated.email, orderDeliveredTemplate(updated, link), "order_delivered");
  } else if (to === "cancelled") {
    await emailForOrder(updated, updated.email, orderCancelledTemplate(updated, note ?? null), "order_cancelled");
  }
  return updated;
}

/** Full refund of an online payment through Razorpay. */
export async function refundOrder(orderId: number, actor: Actor) {
  const order = await getOrderWithItems(orderId);
  if (order.paymentMethod !== "razorpay" || order.paymentStatus !== "paid" || !order.razorpayPaymentId) {
    throw new Error("Only paid Razorpay orders can be refunded here.");
  }
  const refund = await refundPayment(order.razorpayPaymentId);
  await db.update(orders).set({ paymentStatus: "refunded" }).where(eq(orders.id, orderId));
  await db.update(payments).set({ status: "refunded" }).where(eq(payments.providerPaymentId, order.razorpayPaymentId));
  await orderEvent({
    orderId,
    type: "payment",
    message: `Refund of ₹${refund.amount / 100} issued (${refund.id})`,
    actorType: actor.type,
    actorId: actor.id,
  });
}

/* -------------------------------- Shipping --------------------------------- */

/** Creates the Shiprocket order, assigns a courier + AWB, schedules pickup and marks the order shipped. */
export async function createShipment(orderId: number, actor: Actor) {
  if (!integrations.shiprocket()) throw new Error("Shiprocket is not configured. Add SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
  let order = await getOrderWithItems(orderId);
  if (!["confirmed", "processing"].includes(order.status)) throw new Error("Only confirmed orders can be shipped.");
  const settings = await getSettings();

  if (!order.shiprocketShipmentId) {
    const weights = await db
      .select({ id: productVariants.id, weight: productVariants.weightGrams })
      .from(productVariants)
      .where(sql`${productVariants.id} in (${sql.join(order.items.map((i) => sql`${i.variantId}`), sql`, `)})`);
    const weightMap = new Map(weights.map((w) => [w.id, w.weight]));
    const grams = order.items.reduce((n, i) => n + (weightMap.get(i.variantId) ?? 50) * i.quantity, 0) + 100;
    const created = await createShiprocketOrder(order, order.items, settings.fulfilment, grams);
    await db
      .update(orders)
      .set({ shiprocketOrderId: String(created.order_id), shiprocketShipmentId: String(created.shipment_id), status: "processing" })
      .where(eq(orders.id, orderId));
    await orderEvent({
      orderId,
      type: "shipment",
      message: `Created in Shiprocket (order ${created.order_id}, shipment ${created.shipment_id})`,
      actorType: actor.type,
      actorId: actor.id,
    });
    order = await getOrderWithItems(orderId);
  }

  if (!order.awbCode && order.shiprocketShipmentId) {
    const awb = await assignAwb(order.shiprocketShipmentId);
    await db.update(orders).set({ awbCode: awb.awbCode, courierName: awb.courierName }).where(eq(orders.id, orderId));
    await orderEvent({
      orderId,
      type: "shipment",
      message: `AWB ${awb.awbCode} assigned${awb.courierName ? ` (${awb.courierName})` : ""}`,
      actorType: actor.type,
      actorId: actor.id,
    });
    await requestPickup(order.shiprocketShipmentId)
      .then(() => orderEvent({ orderId, type: "shipment", message: "Pickup requested" }))
      .catch((err) => orderEvent({ orderId, type: "shipment", message: `Pickup request failed: ${errorText(err)}`, isInternal: true }));
  }

  return changeOrderStatus(orderId, "shipped", actor, "Handed to courier");
}

/** Pulls the latest courier status from Shiprocket and moves the order to delivered when it is. */
export async function syncTracking(orderId: number, actor: Actor) {
  const order = await getOrderWithItems(orderId);
  if (!order.awbCode) throw new Error("This order has no AWB yet.");
  const tracking = await trackAwb(order.awbCode);
  await applyTrackingStatus(order, tracking.currentStatus, actor);
  return tracking;
}

export async function applyTrackingStatus(order: OrderRow, currentStatus: string | null, actor: Actor) {
  if (!currentStatus || currentStatus === order.trackingStatus) return;
  await db.update(orders).set({ trackingStatus: currentStatus.slice(0, 120) }).where(eq(orders.id, order.id));
  await orderEvent({ orderId: order.id, type: "shipment", message: `Courier status: ${currentStatus}`, actorType: actor.type });
  const s = currentStatus.toUpperCase();
  if (s.includes("DELIVERED") && !s.includes("UNDELIVERED") && order.status === "shipped") {
    await changeOrderStatus(order.id, "delivered", actor, "Confirmed by courier");
  } else if ((s.includes("RTO DELIVERED") || s === "RTO_DELIVERED") && order.status === "shipped") {
    await changeOrderStatus(order.id, "returned", actor, "Returned to origin");
  }
}

/* --------------------------------- Emails ---------------------------------- */

async function emailForOrder(
  order: OrderRow,
  to: string,
  mail: { subject: string; html: string; text: string },
  template: string,
  internal = false,
) {
  const status = await sendMail({ ...mail, to, template, orderId: order.id, userId: internal ? null : order.userId });
  await orderEvent({
    orderId: order.id,
    type: "email",
    message: `Email "${mail.subject}" to ${to}: ${status}`,
    isInternal: true,
  });
  return status;
}

/** Re-sends the latest customer email for an order (Admin → order → Resend). */
export async function resendOrderEmail(orderId: number, kind: "confirmation" | "shipped" | "delivered" | "cancelled") {
  const order = await getOrderWithItems(orderId);
  const link = orderUrl(order.orderNumber);
  const mail =
    kind === "confirmation"
      ? orderConfirmationTemplate(order, order.items, link)
      : kind === "shipped"
        ? orderShippedTemplate(order, link, order.awbCode ? publicTrackingUrl(order.awbCode) : null)
        : kind === "delivered"
          ? orderDeliveredTemplate(order, link)
          : orderCancelledTemplate(order, null);
  return emailForOrder(order, order.email, mail, `order_${kind}`);
}

export function errorText(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}


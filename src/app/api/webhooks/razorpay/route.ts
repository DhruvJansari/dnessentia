import { eq } from "drizzle-orm";
import { db, orders, webhookEvents } from "@/db";
import { orderEvent } from "@/lib/audit";
import { markOrderPaid } from "@/lib/orders/service";
import { verifyWebhookSignature } from "@/lib/razorpay";

type PaymentEntity = { id: string; order_id: string; method?: string; amount: number; error_description?: string | null };
type RazorpayEvent = {
  event: string;
  payload: { payment?: { entity: PaymentEntity }; order?: { entity: { id: string } } };
};

/**
 * Razorpay → Dashboard → Webhooks: point to /api/webhooks/razorpay with events
 * payment.captured, payment.failed and order.paid, using RAZORPAY_WEBHOOK_SECRET.
 * This is the safety net for customers who pay but close the tab before the browser confirms.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) {
    return Response.json({ error: "invalid signature" }, { status: 400 });
  }

  const body = JSON.parse(raw) as RazorpayEvent;
  const payment = body.payload.payment?.entity;
  const [logged] = await db.insert(webhookEvents).values({
    provider: "razorpay",
    eventType: body.event,
    externalId: payment?.id ?? body.payload.order?.entity.id ?? null,
    payload: body as unknown as Record<string, unknown>,
  });

  try {
    const rzpOrderId = payment?.order_id ?? body.payload.order?.entity.id;
    const order = rzpOrderId ? await db.query.orders.findFirst({ where: eq(orders.razorpayOrderId, rzpOrderId) }) : null;
    let status: "processed" | "ignored" = "ignored";

    if (order && payment && (body.event === "payment.captured" || body.event === "order.paid")) {
      await markOrderPaid(
        order.id,
        { razorpayOrderId: rzpOrderId!, razorpayPaymentId: payment.id, method: payment.method, raw: payment as unknown as Record<string, unknown> },
        { type: "webhook" },
      );
      status = "processed";
    } else if (order && payment && body.event === "payment.failed") {
      await orderEvent({
        orderId: order.id,
        type: "payment",
        message: `Payment failed (webhook): ${payment.error_description ?? "unknown reason"}`,
        actorType: "webhook",
      });
      status = "processed";
    }
    await db.update(webhookEvents).set({ status }).where(eq(webhookEvents.id, logged.insertId));
  } catch (err) {
    await db
      .update(webhookEvents)
      .set({ status: "failed", error: err instanceof Error ? err.message : String(err) })
      .where(eq(webhookEvents.id, logged.insertId));
    // 500 makes Razorpay retry later.
    return Response.json({ error: "processing failed" }, { status: 500 });
  }
  return Response.json({ ok: true });
}

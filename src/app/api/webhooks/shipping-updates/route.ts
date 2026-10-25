import { eq } from "drizzle-orm";
import { db, orders, webhookEvents } from "@/db";
import { env } from "@/lib/env";
import { applyTrackingStatus } from "@/lib/orders/service";
import { safeEqual } from "@/lib/tokens";

type ShiprocketTracking = { awb?: string | number; current_status?: string; shipment_status?: string; order_id?: string };

/**
 * Shiprocket → Settings → API → Webhooks. Shiprocket rejects URLs containing "shiprocket", hence this path.
 * Set the security token there to the same value as SHIPROCKET_WEBHOOK_TOKEN; it arrives as the x-api-key header.
 */
export async function POST(request: Request) {
  const token = request.headers.get("x-api-key") ?? "";
  if (!env.shiprocket.webhookToken || !safeEqual(token, env.shiprocket.webhookToken)) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as ShiprocketTracking;
  const awb = body.awb ? String(body.awb) : null;
  const [logged] = await db.insert(webhookEvents).values({
    provider: "shiprocket",
    eventType: body.current_status ?? body.shipment_status ?? "tracking",
    externalId: awb,
    payload: body as Record<string, unknown>,
  });

  try {
    const order = awb ? await db.query.orders.findFirst({ where: eq(orders.awbCode, awb) }) : null;
    if (order) await applyTrackingStatus(order, body.current_status ?? body.shipment_status ?? null, { type: "webhook" });
    await db.update(webhookEvents).set({ status: order ? "processed" : "ignored" }).where(eq(webhookEvents.id, logged.insertId));
  } catch (err) {
    await db
      .update(webhookEvents)
      .set({ status: "failed", error: err instanceof Error ? err.message : String(err) })
      .where(eq(webhookEvents.id, logged.insertId));
  }
  // Always 200 so Shiprocket doesn't disable the webhook; failures are visible in Admin → Activity.
  return Response.json({ ok: true });
}

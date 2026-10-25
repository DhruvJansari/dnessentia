import "server-only";
import { createHmac } from "node:crypto";
import { env } from "../env";
import { safeEqual } from "../tokens";

/** Guest order links carry a key derived from the order number, so any email can include a working link. */
export function orderAccessKey(orderNumber: string) {
  if (!env.appSecret) throw new Error("APP_SECRET is not set");
  return createHmac("sha256", env.appSecret).update(`order:${orderNumber}`).digest("base64url").slice(0, 32);
}

export function isValidOrderKey(orderNumber: string, key: string | null | undefined) {
  return Boolean(key) && safeEqual(orderAccessKey(orderNumber), key!);
}

export function orderUrl(orderNumber: string) {
  return `${env.appUrl}/order/${orderNumber}?key=${orderAccessKey(orderNumber)}`;
}

export function adminOrderUrl(orderId: number) {
  return `${env.appUrl}/admin/orders/${orderId}`;
}

import "server-only";
import { createHmac } from "node:crypto";
import { env } from "./env";
import { safeEqual } from "./tokens";

const API = "https://api.razorpay.com/v1";

function authHeader() {
  return "Basic " + Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString("base64");
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: authHeader(), "Content-Type": "application/json", ...init.headers },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = body?.error?.description ?? `Razorpay ${res.status}`;
    throw new Error(message);
  }
  return body as T;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; receipt: string; status: string };
export type RazorpayPayment = {
  id: string;
  order_id: string;
  amount: number;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method: string;
  email?: string;
  contact?: string;
  error_description?: string | null;
};

/** Amounts are passed in rupees and converted to paise here. */
export function createRazorpayOrder(amountRupees: number, receipt: string, notes: Record<string, string>) {
  return call<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: amountRupees * 100, currency: "INR", receipt, notes, payment_capture: 1 }),
  });
}

export function fetchPayment(paymentId: string) {
  return call<RazorpayPayment>(`/payments/${paymentId}`);
}

export function refundPayment(paymentId: string, amountRupees?: number) {
  return call<{ id: string; amount: number; status: string }>(`/payments/${paymentId}/refund`, {
    method: "POST",
    body: JSON.stringify(amountRupees ? { amount: amountRupees * 100 } : {}),
  });
}

/** Signature returned to the browser by Razorpay Checkout after a successful payment. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** X-Razorpay-Signature on webhook calls, computed over the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!env.razorpay.webhookSecret) return false;
  const expected = createHmac("sha256", env.razorpay.webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

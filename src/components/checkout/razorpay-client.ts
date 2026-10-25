"use client";

import type { RazorpayPayload } from "@/app/(store)/checkout/actions";

type RazorpaySuccess = { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string };
type RazorpayFailure = { error: { description?: string; reason?: string } };

type RazorpayInstance = { open: () => void; on: (event: "payment.failed", cb: (r: RazorpayFailure) => void) => void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

function loadScript() {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Could not load Razorpay. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return loading;
}

export type PaymentOutcome =
  | { status: "paid"; response: RazorpaySuccess }
  | { status: "dismissed" }
  | { status: "failed"; reason: string };

/** Opens Razorpay Checkout and resolves once the customer pays or closes the window. */
export async function openRazorpay(p: RazorpayPayload, onFailedAttempt?: (reason: string) => void): Promise<PaymentOutcome> {
  await loadScript();
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: p.keyId,
      order_id: p.razorpayOrderId,
      amount: p.amount,
      currency: "INR",
      name: "DN Essentia",
      description: `Order ${p.orderNumber}`,
      image: "/images/brand/logo-square.jpg",
      prefill: { name: p.name, email: p.email, contact: p.contact },
      notes: { order_number: p.orderNumber },
      theme: { color: "#1c1712" },
      handler: (response: RazorpaySuccess) => resolve({ status: "paid", response }),
      modal: { ondismiss: () => resolve({ status: "dismissed" }), confirm_close: true },
    });
    // Failed attempts don't close the modal (the customer can retry), so just report them.
    rzp.on("payment.failed", (r) => onFailedAttempt?.(r.error?.description ?? r.error?.reason ?? "Payment failed"));
    rzp.open();
  });
}

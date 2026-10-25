"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmPaymentAction, paymentFailedAction, retryPaymentAction } from "@/app/(store)/checkout/actions";
import { useCart } from "@/components/cart/cart-context";
import { openRazorpay } from "@/components/checkout/razorpay-client";
import { FormAlert, Spinner } from "@/components/ui/form";
import { formatPrice } from "@/lib/format";

export function RetryPayment({ orderNumber, accessKey, amount }: { orderNumber: string; accessKey: string; amount: number }) {
  const router = useRouter();
  const { clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await retryPaymentAction({ orderNumber, key: accessKey });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const outcome = await openRazorpay(res.razorpay, (reason) => void paymentFailedAction({ orderNumber, key: accessKey, reason }));
      if (outcome.status !== "paid") return;
      const confirmed = await confirmPaymentAction({
        orderNumber,
        key: accessKey,
        razorpayOrderId: outcome.response.razorpay_order_id,
        razorpayPaymentId: outcome.response.razorpay_payment_id,
        signature: outcome.response.razorpay_signature,
      });
      if (!confirmed.ok) {
        setError(confirmed.error ?? "Payment verification failed.");
        return;
      }
      clear();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <FormAlert error={error ?? undefined} />
      <button type="button" onClick={pay} disabled={busy} className="btn btn-dark h-13 px-10">
        {busy && <Spinner />} Pay {formatPrice(amount)} now
      </button>
    </div>
  );
}

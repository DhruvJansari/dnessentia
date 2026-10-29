"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { cancelOrderAction, requestReplacementAction } from "@/app/(store)/order/actions";
import { formatPrice } from "@/lib/format";
import { FormAlert, Spinner, SubmitButton } from "../ui/form";

export function CancelOrder({
  orderNumber,
  accessKey,
  charge,
  refund,
  chargePercent,
  deadline,
  prepaid,
}: {
  orderNumber: string;
  accessKey: string;
  charge: number;
  refund: number;
  chargePercent: number;
  deadline: string | null;
  prepaid: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="link-underline text-sm text-muted hover:text-ink">
        Cancel this order{deadline ? ` (until ${deadline})` : ""}
      </button>
    );
  }
  return (
    <div className="animate-fade-up border border-line bg-white p-5">
      <p className="font-medium">Cancel order {orderNumber}?</p>
      {prepaid ? (
        <p className="mt-2 text-sm text-ink-soft">
          As per our policy, a {chargePercent}% cancellation charge of <strong>{formatPrice(charge)}</strong> applies. We&apos;ll refund{" "}
          <strong>{formatPrice(refund)}</strong> to your original payment method within 5-7 business days.
        </p>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">No payment has been taken, so there&apos;s no charge.</p>
      )}
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={200}
        rows={2}
        placeholder="Reason (optional)"
        className="mt-3 block w-full border border-line px-3 py-2 text-sm outline-none focus:border-ink"
      />
      <FormAlert error={error ?? undefined} />
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelOrderAction({ orderNumber, key: accessKey, reason });
              if (r.ok) router.refresh();
              else setError(r.message);
            })
          }
          className="btn h-11 border border-red-700 bg-red-700 text-white hover:bg-red-800"
        >
          {pending && <Spinner />} Yes, cancel order
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline h-11">
          Keep my order
        </button>
      </div>
    </div>
  );
}

type Item = { id: number; name: string; variantLabel: string; quantity: number };

export function ReplacementForm({ orderNumber, accessKey, items, windowDays }: { orderNumber: string; accessKey: string; items: Item[]; windowDays: number }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(requestReplacementAction, {});
  if (state.ok) return <FormAlert message={state.message} />;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline h-11">
        Report a problem / request replacement
      </button>
    );
  }
  return (
    <form action={action} className="animate-fade-up space-y-4 border border-line bg-white p-5 sm:p-6">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <input type="hidden" name="key" value={accessKey} />
      <div>
        <p className="font-medium">Request a replacement</p>
        <p className="mt-1 text-sm text-muted">
          We don&apos;t accept returns. For a damaged, leaked, wrong or missing product we send a replacement of the product within {windowDays} days of
          delivery. Delivery and packaging charges are not refundable.
        </p>
      </div>
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium text-ink-soft">Which products?</legend>
        <div className="space-y-2">
          {items.map((i) => (
            <label key={i.id} className="flex items-center justify-between gap-3 border border-line px-3 py-2 text-sm has-[:checked]:border-ink">
              <span className="flex items-center gap-3">
                <input type="checkbox" name="item" value={i.id} defaultChecked={items.length === 1} className="size-4 accent-[var(--color-ink)]" />
                {i.name} <span className="text-muted">{i.variantLabel}</span>
              </span>
              {i.quantity > 1 && (
                <select name={`qty-${i.id}`} defaultValue={1} className="h-8 border border-line bg-white px-2 text-sm" aria-label={`Quantity of ${i.name}`}>
                  {Array.from({ length: i.quantity }, (_, n) => (
                    <option key={n + 1} value={n + 1}>
                      {n + 1}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">What happened?</span>
        <select name="reason" required className="h-11 w-full border border-line bg-white px-3 text-sm">
          <option value="damaged">Product arrived damaged</option>
          <option value="leaked">Bottle leaked</option>
          <option value="wrong_item">I received the wrong product</option>
          <option value="missing_item">An item was missing</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Details</span>
        <textarea name="details" required rows={3} className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-ink" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Unboxing video link</span>
        <input name="videoUrl" type="url" placeholder="https://drive.google.com/…" className="h-11 w-full border border-line px-3 text-sm outline-none focus:border-ink" />
        <span className="mt-1 block text-[12px] text-muted">Required for damage, leakage or missing items. Upload to Google Drive and share the link.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">Photos (up to 3, 5 MB each)</span>
        <input name="photos" type="file" accept="image/png,image/jpeg,image/webp" multiple className="block w-full text-sm" />
      </label>
      <FormAlert error={state.ok === false ? state.message : undefined} />
      <div className="flex flex-wrap gap-3">
        <SubmitButton className="btn btn-dark h-11">Send request</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-outline h-11">
          Close
        </button>
      </div>
    </form>
  );
}

/** Fires the GA4 purchase event once per order on the thank-you page. */
export { PurchaseTracker } from "./purchase-tracker";

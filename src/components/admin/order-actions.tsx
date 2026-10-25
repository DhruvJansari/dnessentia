"use client";

import { useState, useTransition } from "react";
import {
  addNoteAction,
  createShipmentAction,
  refundAction,
  resendEmailAction,
  syncTrackingAction,
  updateStatusAction,
  type ActionResult,
} from "@/app/admin/orders/actions";
import type { OrderStatus } from "@/db/schema";
import { Spinner } from "../ui/form";
import { btn, input } from "./ui";

function useAction() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const run = (fn: () => Promise<ActionResult>) => start(async () => setResult(await fn()));
  return { pending, result, run };
}

function Result({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p role="status" className={`mt-3 animate-fade-up rounded-lg px-3 py-2 text-sm ${result.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
      {result.message}
    </p>
  );
}

export function StatusControl({ orderId, next }: { orderId: number; next: OrderStatus[] }) {
  const { pending, result, run } = useAction();
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [note, setNote] = useState("");
  if (next.length === 0) return <p className="text-sm text-stone-500">This order is closed. No further status changes.</p>;
  return (
    <div>
      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={input} aria-label="New status">
          <option value="">Move to…</option>
          {next.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!status || pending}
          onClick={() =>
            run(async () => {
              if (status === "cancelled" && !confirm("Cancel this order? Stock is returned and the customer is emailed.")) {
                return { ok: false, message: "Not cancelled." };
              }
              const r = await updateStatusAction({ orderId, status: status as OrderStatus, note });
              if (r.ok) {
                setStatus("");
                setNote("");
              }
              return r;
            })
          }
          className={btn.primary}
        >
          {pending && <Spinner />} Update
        </button>
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / note (optional, shown on timeline)" className={`${input} mt-2`} />
      <Result result={result} />
    </div>
  );
}

export function ShipmentControls({
  orderId,
  canCreate,
  hasAwb,
  configured,
}: {
  orderId: number;
  canCreate: boolean;
  hasAwb: boolean;
  configured: boolean;
}) {
  const { pending, result, run } = useAction();
  if (!configured) {
    return <p className="text-sm text-stone-500">Add Shiprocket credentials to .env.local to create shipments from here.</p>;
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canCreate && (
          <button type="button" disabled={pending} onClick={() => run(() => createShipmentAction(orderId))} className={btn.primary}>
            {pending && <Spinner />} Create shipment
          </button>
        )}
        {hasAwb && (
          <button type="button" disabled={pending} onClick={() => run(() => syncTrackingAction(orderId))} className={btn.secondary}>
            {pending && <Spinner />} Sync tracking
          </button>
        )}
      </div>
      <Result result={result} />
    </div>
  );
}

export function RefundButton({ orderId, amount }: { orderId: number; amount: number }) {
  const { pending, result, run } = useAction();
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(async () =>
            confirm(`Refund ₹${amount} to the customer through Razorpay? This can't be undone.`)
              ? refundAction(orderId)
              : { ok: false, message: "Refund cancelled." },
          )
        }
        className={btn.danger}
      >
        {pending && <Spinner />} Refund ₹{amount}
      </button>
      <Result result={result} />
    </div>
  );
}

export function ResendEmail({ orderId }: { orderId: number }) {
  const { pending, result, run } = useAction();
  const [kind, setKind] = useState<"confirmation" | "shipped" | "delivered" | "cancelled">("confirmation");
  return (
    <div>
      <div className="flex gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={input} aria-label="Email to resend">
          <option value="confirmation">Order confirmation</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="button" disabled={pending} onClick={() => run(() => resendEmailAction(orderId, kind))} className={btn.secondary}>
          {pending && <Spinner />} Resend
        </button>
      </div>
      <Result result={result} />
    </div>
  );
}

export function NoteForm({ orderId }: { orderId: number }) {
  const { pending, result, run } = useAction();
  const [note, setNote] = useState("");
  const [internal, setInternal] = useState(true);
  return (
    <div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Add a note to the timeline…"
        className={`${input} h-auto py-2`}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-stone-600">
          <input type="checkbox" checked={!internal} onChange={(e) => setInternal(!e.target.checked)} className="size-4 accent-stone-900" />
          Visible to customer
        </label>
        <button
          type="button"
          disabled={pending || !note.trim()}
          onClick={() =>
            run(async () => {
              const r = await addNoteAction({ orderId, note, internal });
              if (r.ok) setNote("");
              return r;
            })
          }
          className={btn.secondary}
        >
          {pending && <Spinner />} Add note
        </button>
      </div>
      <Result result={result} />
    </div>
  );
}

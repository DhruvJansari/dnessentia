"use client";

import { useState, useTransition } from "react";
import {
  addNoteAction,
  cancelOrderAdminAction,
  decideReplacementAction,
  printLabelAction,
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
  if (next.filter((s) => s !== "cancelled").length === 0) return <p className="text-sm text-stone-500">No further status changes for this order.</p>;
  return (
    <div>
      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)} className={input} aria-label="New status">
          <option value="">Move to…</option>
          {next.filter((s) => s !== "cancelled").map((s) => (
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

export function CancelControl({ orderId, prepaid, total, chargePercent, isAdmin }: { orderId: number; prepaid: boolean; total: number; chargePercent: number; isAdmin: boolean }) {
  const { pending, result, run } = useAction();
  const [open, setOpen] = useState(false);
  const [refund, setRefund] = useState<"full" | "policy" | "none">(prepaid && isAdmin ? "policy" : "none");
  const [note, setNote] = useState("");
  const charge = Math.round((total * chargePercent) / 100);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.danger}>
        Cancel order
      </button>
    );
  }
  return (
    <div className="space-y-3 rounded-xl border border-red-100 bg-red-50/40 p-4">
      {prepaid ? (
        <fieldset className="space-y-2 text-sm">
          <legend className="mb-1 font-medium">Refund to customer</legend>
          {[
            ["policy", `Keep ${chargePercent}% charge, refund ₹${total - charge}`],
            ["full", `Full refund ₹${total}`],
            ["none", "No refund"],
          ].map(([v, label]) => (
            <label key={v} className={`flex items-center gap-2 ${!isAdmin && v !== "none" ? "opacity-40" : ""}`}>
              <input type="radio" name={`refund-${orderId}`} checked={refund === v} disabled={!isAdmin && v !== "none"} onChange={() => setRefund(v as typeof refund)} className="accent-stone-900" />
              {label}
            </label>
          ))}
          {!isAdmin && <p className="text-[12px] text-stone-500">Only admins can issue refunds.</p>}
        </fieldset>
      ) : (
        <p className="text-sm text-stone-600">No online payment was taken, so nothing to refund. Stock is put back.</p>
      )}
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason (shown to the customer)" className={input} />
      <div className="flex gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => cancelOrderAdminAction({ orderId, refund, note }))} className={btn.danger}>
          {pending && <Spinner />} Confirm cancellation
        </button>
        <button type="button" onClick={() => setOpen(false)} className={btn.secondary}>
          Back
        </button>
      </div>
      <Result result={result} />
    </div>
  );
}

export function LabelButton({ orderId }: { orderId: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await printLabelAction(orderId);
            if (r.ok && r.url) window.open(r.url, "_blank", "noopener");
            else setError(r.message);
          })
        }
        className={btn.secondary}
      >
        {pending && <Spinner />} Print shipping label
      </button>
      {error && <p className="mt-2 text-[13px] text-red-700">{error}</p>}
    </div>
  );
}

export function ReplacementDecision({ requestId, orderId }: { requestId: number; orderId: number }) {
  const { pending, result, run } = useAction();
  const [note, setNote] = useState("");
  if (result?.ok) return <Result result={result} />;
  return (
    <div className="mt-3 space-y-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note to the customer (optional)" className={input} />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} onClick={() => run(() => decideReplacementAction({ requestId, orderId, approve: true, note }))} className={btn.primary}>
          {pending && <Spinner />} Approve & create replacement
        </button>
        <button type="button" disabled={pending} onClick={() => run(() => decideReplacementAction({ requestId, orderId, approve: false, note }))} className={btn.danger}>
          Reject
        </button>
      </div>
      <Result result={result} />
    </div>
  );
}

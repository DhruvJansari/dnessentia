import type { OrderStatus, PaymentStatus } from "@/db/schema";

const tone: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-sky-50 text-sky-800 ring-sky-200",
  processing: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  shipped: "bg-violet-50 text-violet-800 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-stone-100 text-stone-600 ring-stone-200",
  returned: "bg-rose-50 text-rose-800 ring-rose-200",
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  unpaid: "bg-amber-50 text-amber-800 ring-amber-200",
  failed: "bg-rose-50 text-rose-800 ring-rose-200",
  refunded: "bg-stone-100 text-stone-600 ring-stone-200",
};

export function StatusBadge({ status, label }: { status: OrderStatus | PaymentStatus | string; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ring-1 ring-inset ${
        tone[status] ?? "bg-stone-100 text-stone-700 ring-stone-200"
      }`}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label ?? status}
    </span>
  );
}

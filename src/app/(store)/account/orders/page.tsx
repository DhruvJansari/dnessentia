import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/orders/order-status-badge";
import { statusLabel } from "@/components/orders/order-view";
import { db, orders } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

export default function OrdersPage() {
  return (
    <div>
      <p className="eyebrow">Orders</p>
      <h1 className="mt-3 text-5xl">Order history</h1>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse bg-cream" />}>
        <OrderList />
      </Suspense>
    </div>
  );
}

async function OrderList() {
  const user = await requireUser("/account/orders");
  const rows = await db.query.orders.findMany({
    where: eq(orders.userId, user.id),
    orderBy: desc(orders.createdAt),
    with: { items: { columns: { name: true, quantity: true } } },
  });
  if (rows.length === 0) {
    return (
      <div className="mt-8 border border-dashed border-line p-10 text-center">
        <p className="text-muted">You haven&apos;t placed any orders yet.</p>
        <Link href="/attar" className="btn btn-dark mt-5">
          Shop attars
        </Link>
      </div>
    );
  }
  return (
    <ul className="reveal-stagger mt-8 space-y-4">
      {rows.map((o) => (
        <li key={o.id}>
          <Link
            href={`/order/${o.orderNumber}`}
            className="block border border-line bg-white p-5 transition-shadow duration-500 hover:shadow-[0_20px_40px_-28px_rgba(28,23,18,0.4)] sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{o.orderNumber}</p>
                <p className="text-sm text-muted">{dateFmt.format(o.createdAt)}</p>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={o.status} label={statusLabel(o)} />
                <span className="font-serif text-2xl">{formatPrice(o.total)}</span>
              </div>
            </div>
            <p className="mt-3 truncate text-sm text-ink-soft">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</p>
            {o.awbCode && (
              <p className="mt-1 text-[13px] text-muted">
                AWB {o.awbCode}
                {o.trackingStatus ? ` · ${o.trackingStatus}` : ""}
              </p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

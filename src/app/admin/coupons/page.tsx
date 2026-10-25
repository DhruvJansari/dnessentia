import { desc } from "drizzle-orm";
import { Suspense } from "react";
import { CouponForm } from "@/components/admin/coupon-form";
import { btn, Card, Empty, fmtDate, inr, PageTitle, Skeleton } from "@/components/admin/ui";
import { coupons, db } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { toggleCouponAction } from "./actions";

export const metadata = { title: "Coupons" };

export default function CouponsPage() {
  return (
    <>
      <PageTitle title="Coupons" description="Discount codes customers enter at checkout. Usage is counted when an order is confirmed." />
      <Suspense fallback={<Skeleton rows={2} />}>
        <Coupons />
      </Suspense>
    </>
  );
}

const iso = (d: Date | null) => (d ? new Date(d.getTime() + 5.5 * 3600e3).toISOString().slice(0, 10) : "");

async function Coupons() {
  await requireAdmin();
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        {rows.length === 0 && (
          <Card>
            <Empty title="No coupons yet" />
          </Card>
        )}
        {rows.map((c) => (
          <Card key={c.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2">
                  <span className="rounded-md bg-stone-900 px-2 py-1 font-mono text-sm text-white">{c.code}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[12px] ${c.isActive ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>
                    {c.isActive ? "Active" : "Paused"}
                  </span>
                </p>
                <p className="mt-2 text-sm">
                  {c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `${inr(c.value)} off` : `Free gift: ${c.description}`}
                  {c.minOrder ? ` · min order ${inr(c.minOrder)}` : ""}
                </p>
                <p className="mt-1 text-[12px] text-stone-500">
                  Used {c.usedCount}
                  {c.maxUses ? ` / ${c.maxUses}` : ""} times
                  {c.startsAt ? ` · from ${fmtDate(c.startsAt)}` : ""}
                  {c.endsAt ? ` · until ${fmtDate(c.endsAt)}` : ""}
                </p>
              </div>
              <form action={toggleCouponAction}>
                <input type="hidden" name="id" value={c.id} />
                <button className={btn.secondary}>{c.isActive ? "Pause" : "Activate"}</button>
              </form>
            </div>
            <details className="mt-4 border-t border-stone-100 pt-4">
              <summary className="cursor-pointer text-sm text-stone-600">Edit</summary>
              <div className="mt-4">
                <CouponForm
                  coupon={{
                    id: c.id,
                    code: c.code,
                    description: c.description,
                    type: c.type,
                    value: c.value,
                    minOrder: c.minOrder,
                    maxUses: c.maxUses,
                    startsAt: iso(c.startsAt),
                    endsAt: iso(c.endsAt),
                    isActive: c.isActive,
                  }}
                />
              </div>
            </details>
          </Card>
        ))}
      </div>
      <Card title="New coupon" className="h-fit xl:sticky xl:top-8">
        <CouponForm />
      </Card>
    </div>
  );
}

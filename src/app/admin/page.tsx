import Link from "next/link";
import { Suspense } from "react";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { btn, Card, Empty, fmtDateTime, inr, PageTitle, Skeleton, Stat, Table, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/orders/order-status-badge";
import { getDashboard } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/auth/session";
import { integrations } from "@/lib/env";

export const metadata = { title: "Dashboard" };

export default function DashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<Skeleton rows={2} />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

const ranges = [7, 30, 90] as const;

function Delta({ now, before }: { now: number; before: number }) {
  if (before === 0) return <span className="text-stone-500">{now > 0 ? "New this period" : "No sales yet"}</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span className={up ? "text-emerald-700" : "text-red-700"}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% <span className="text-stone-500">vs previous period</span>
    </span>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const user = await requireStaff();
  const requested = Number((await searchParams).range);
  const range = (ranges as readonly number[]).includes(requested) ? (requested as (typeof ranges)[number]) : 30;
  const d = await getDashboard(range);
  const setup = [
    { ok: integrations.razorpay(), label: "Razorpay keys", hint: "Add RAZORPAY_KEY_ID / SECRET to take online payments" },
    { ok: integrations.smtp(), label: "SMTP email", hint: "Add SMTP_* settings so customers receive emails" },
    { ok: integrations.shiprocket(), label: "Shiprocket", hint: "Add SHIPROCKET_EMAIL / PASSWORD to create shipments" },
  ].filter((s) => !s.ok);

  return (
    <div className="space-y-6">
      <PageTitle
        title={`Good to see you, ${user.name.split(" ")[0] || "there"}`}
        description="Here's how the store is doing."
        actions={
          <Link href="/admin/orders?status=to_ship" className={btn.primary}>
            {d.toShip} to ship
          </Link>
        }
      />

      {setup.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm">
          <p className="font-medium text-amber-900">Finish setting up</p>
          <ul className="mt-1 list-inside list-disc text-amber-900/80">
            {setup.map((s) => (
              <li key={s.label}>
                <strong>{s.label}:</strong> {s.hint}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue today" value={inr(d.today.revenue)} hint={`${d.today.orders} order${d.today.orders === 1 ? "" : "s"}`} />
        <Stat label="Last 30 days" value={inr(d.month.revenue)} hint={`${d.month.orders} orders · AOV ${inr(d.aov)}`} />
        <Stat label="Ready to ship" value={d.toShip} hint="Confirmed or processing" tone={d.toShip ? "warn" : "default"} />
        <Stat label="Customers" value={d.customers} hint={`${d.awaitingPayment} awaiting payment`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card
          title={
            <div>
              <h2 className="font-sans text-[15px] font-semibold tracking-normal">Revenue</h2>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight">{inr(d.range.revenue)}</p>
              <p className="mt-1.5 text-[12px]">
                {d.range.orders} order{d.range.orders === 1 ? "" : "s"} · <Delta now={d.range.revenue} before={d.range.previous.revenue} />
              </p>
            </div>
          }
          actions={
            <nav aria-label="Chart range" className="flex rounded-lg bg-stone-100 p-0.5 text-[13px]">
              {ranges.map((r) => (
                <Link
                  key={r}
                  href={r === 30 ? "/admin" : `/admin?range=${r}`}
                  scroll={false}
                  aria-current={r === range ? "true" : undefined}
                  className={`rounded-md px-3 py-1 transition-colors ${r === range ? "bg-white font-medium shadow-sm" : "text-stone-500 hover:text-stone-900"}`}
                >
                  {r}d
                </Link>
              ))}
            </nav>
          }
        >
          <RevenueChart data={d.chart} />
        </Card>
        <Card title="Orders by status">
          <ul className="space-y-2.5">
            {(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"] as const).map((s) => (
              <li key={s}>
                <Link href={`/admin/orders?status=${s}`} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-stone-50">
                  <StatusBadge status={s} />
                  <span className="text-sm font-medium tabular-nums">{d.statusCounts[s] ?? 0}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card title="Recent orders" padded={false} actions={<Link href="/admin/orders" className={btn.ghost}>View all</Link>}>
          {d.recent.length === 0 ? (
            <Empty title="No orders yet" text="New orders will appear here the moment they're placed." />
          ) : (
            <Table head={["Order", "Customer", "Status", "Payment", "Total", "Placed"]}>
              {d.recent.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-stone-50">
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td>{o.customerName}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td>
                    <StatusBadge status={o.paymentStatus} label={`${o.paymentMethod === "cod" ? "COD" : "Online"} · ${o.paymentStatus}`} />
                  </Td>
                  <Td className="tabular-nums">{inr(o.total)}</Td>
                  <Td className="text-stone-500">{fmtDateTime(o.createdAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Low stock" actions={<span className="text-[12px] text-stone-500">≤ {d.lowStockThreshold}</span>}>
            {d.lowStock.length === 0 ? (
              <p className="text-sm text-stone-500">Everything is well stocked.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {d.lowStock.map((v) => (
                  <li key={v.id} className="flex items-center justify-between">
                    <Link href={`/admin/products/${v.productId}`} className="hover:underline">
                      {v.name} <span className="text-stone-500">{v.label}</span>
                    </Link>
                    <span className={`font-medium tabular-nums ${v.stock <= 0 ? "text-red-700" : "text-amber-700"}`}>{v.stock}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Latest activity" actions={<Link href="/admin/activity" className={btn.ghost}>All</Link>}>
            {d.activity.length === 0 ? (
              <p className="text-sm text-stone-500">Admin actions will be logged here.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {d.activity.map((a) => (
                  <li key={a.id}>
                    <p>{a.summary}</p>
                    <p className="text-[12px] text-stone-500">
                      {a.actorEmail ?? "System"} · {fmtDateTime(a.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, fmtDateTime, inr, PageTitle, Pagination, Skeleton, Table, Tabs, Td, input, btn } from "@/components/admin/ui";
import { SearchIcon } from "@/components/icons";
import { StatusBadge } from "@/components/orders/order-status-badge";
import { listOrders } from "@/lib/admin/queries";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Orders" };

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageTitle
        title="Orders"
        description="Every order, its payment and its shipment. Click an order to manage it."
        actions={
          <form action="/admin/export/orders" className="flex flex-wrap items-end gap-2">
            <label className="text-[12px] text-stone-500">
              From
              <input type="date" name="from" className={`${input} mt-1 w-auto`} />
            </label>
            <label className="text-[12px] text-stone-500">
              To
              <input type="date" name="to" className={`${input} mt-1 w-auto`} />
            </label>
            <button className={btn.secondary}>Export CSV</button>
          </form>
        }
      />
      <Suspense fallback={<Skeleton rows={1} />}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const statusTabs = [
  ["all", "All"],
  ["to_ship", "To ship"],
  ["pending", "Pending"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
] as const;

async function OrdersTable({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  await requireStaff();
  const sp = await searchParams;
  const str = (v: unknown) => (typeof v === "string" ? v : undefined);
  const filters = { q: str(sp.q), status: str(sp.status) ?? "all", payment: str(sp.payment) ?? "all", page: Number(str(sp.page) ?? 1) };
  const { rows, total, page, pages, byStatus } = await listOrders(filters);

  const href = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q: filters.q, status: filters.status, payment: filters.payment, ...over };
    for (const [k, v] of Object.entries(merged)) if (v && v !== "all" && !(k === "page" && Number(v) === 1)) p.set(k, String(v));
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };
  const counts: Record<string, number> = {
    all: Object.values(byStatus).reduce((a, b) => a + b, 0),
    to_ship: (byStatus.confirmed ?? 0) + (byStatus.processing ?? 0),
    ...byStatus,
  };

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs active={filters.status} items={statusTabs.map(([key, label]) => ({ key, label, count: counts[key] ?? 0, href: href({ status: key, page: 1 }) }))} />
        <form className="mb-4 flex flex-wrap gap-2" action="/admin/orders">
          {filters.status !== "all" && <input type="hidden" name="status" value={filters.status} />}
          <div className="relative w-full sm:w-auto">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <input name="q" defaultValue={filters.q} placeholder="Order no., email, phone, AWB" className={`${input} w-full pl-9 sm:w-72`} />
          </div>
          <select name="payment" defaultValue={filters.payment} className={`${input} w-auto flex-1 sm:w-36 sm:flex-none`}>
            <option value="all">Any payment</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <button className={btn.secondary}>Filter</button>
        </form>
      </div>
      <Card padded={false}>
        {rows.length === 0 ? (
          <Empty title="No orders match" text="Try a different filter or search." action={<Link href="/admin/orders" className={btn.secondary}>Clear filters</Link>} />
        ) : (
          <Table head={["Order", "Customer", "Status", "Payment", "Shipment", "Total", "Placed"]}>
            {rows.map((o) => (
              <tr key={o.id} className="group relative transition-colors hover:bg-stone-50">
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-medium after:absolute after:inset-0">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td>
                  <p>{o.customerName}</p>
                  <p className="text-[12px] text-stone-500">{o.email}</p>
                </Td>
                <Td>
                  <StatusBadge status={o.status} />
                </Td>
                <Td>
                  <StatusBadge status={o.paymentStatus} label={`${o.paymentMethod === "cod" ? "COD" : "Online"} · ${o.paymentStatus}`} />
                </Td>
                <Td className="text-stone-600">{o.awbCode ? `${o.courierName ?? "AWB"} ${o.awbCode}` : "-"}</Td>
                <Td className="font-medium tabular-nums">{inr(o.total)}</Td>
                <Td className="text-stone-500">{fmtDateTime(o.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
        <Pagination page={page} pages={pages} makeHref={(p) => href({ page: p })} />
      </Card>
      <p className="mt-3 text-[12px] text-stone-500">{total} order{total === 1 ? "" : "s"}</p>
    </>
  );
}

import { asc, desc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NoteForm, RefundButton, ResendEmail, ShipmentControls, StatusControl } from "@/components/admin/order-actions";
import { Card, fmtDateTime, inr, Skeleton } from "@/components/admin/ui";
import { ExternalIcon } from "@/components/icons";
import { StatusBadge } from "@/components/orders/order-status-badge";
import { db, emailLogs, orderEvents, orders, payments, users } from "@/db";
import { requireStaff } from "@/lib/auth/session";
import { integrations } from "@/lib/env";
import { orderUrl } from "@/lib/orders/access";
import { nextStatuses } from "@/lib/orders/service";
import { publicTrackingUrl } from "@/lib/shiprocket";

export const metadata = { title: "Order" };

export default function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton rows={3} />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

const eventTone: Record<string, string> = {
  created: "bg-stone-900",
  status: "bg-sky-500",
  payment: "bg-emerald-500",
  shipment: "bg-violet-500",
  email: "bg-stone-300",
  note: "bg-amber-500",
  stock: "bg-stone-300",
};

async function OrderDetail({ params }: { params: PageProps<"/admin/orders/[id]">["params"] }) {
  await requireStaff();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id), with: { items: true } });
  if (!order) notFound();

  const [events, emails, pays, customer] = await Promise.all([
    db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(desc(orderEvents.createdAt), desc(orderEvents.id)),
    db.select().from(emailLogs).where(eq(emailLogs.orderId, id)).orderBy(desc(emailLogs.createdAt)),
    db.select().from(payments).where(eq(payments.orderId, id)).orderBy(asc(payments.createdAt)),
    order.userId ? db.query.users.findFirst({ where: eq(users.id, order.userId) }) : null,
  ]);
  const actorIds = [...new Set(events.map((e) => e.actorId).filter((x): x is number => x != null))];
  const actors = actorIds.length
    ? new Map((await db.query.users.findMany({ where: (u, { inArray }) => inArray(u.id, actorIds), columns: { id: true, email: true } })).map((u) => [u.id, u.email]))
    : new Map<number, string>();

  const canShip = ["confirmed", "processing"].includes(order.status) && (!order.awbCode || !order.shiprocketShipmentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-stone-500 hover:text-stone-900">
            ← Orders
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-4xl leading-none">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} label={`${order.paymentMethod === "cod" ? "COD" : "Online"} · ${order.paymentStatus}`} />
          </div>
          <p className="mt-2 text-sm text-stone-500">Placed {fmtDateTime(order.createdAt)} · IP {order.ip ?? "-"}</p>
        </div>
        <a href={orderUrl(order.orderNumber)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900">
          Customer view <ExternalIcon className="size-4" />
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card title={`Items (${order.items.reduce((n, i) => n + i.quantity, 0)})`}>
            <ul className="divide-y divide-stone-100">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-4 py-3 first:pt-0">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-stone-50">
                    {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-contain" />}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/admin/products/${i.productId}`} className="font-medium hover:underline">
                      {i.name}
                    </Link>
                    <p className="text-stone-500">
                      {i.variantLabel} · SKU {i.sku}
                    </p>
                    {i.selections?.length ? <p className="mt-0.5 text-[12px] text-stone-500">Picked: {i.selections.join(", ")}</p> : null}
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <p>
                      {inr(i.unitPrice)} × {i.quantity}
                    </p>
                    <p className="font-medium">{inr(i.lineTotal)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-stone-100 pt-4 text-sm">
              <Line k="Subtotal" v={inr(order.subtotal)} />
              {order.discount > 0 && <Line k={`Discount (${order.couponCode})`} v={`− ${inr(order.discount)}`} />}
              {order.couponCode && order.discount === 0 && <Line k="Coupon" v={order.couponCode} />}
              <Line k="Shipping" v={order.shippingFee ? inr(order.shippingFee) : "Free"} />
              {order.codFee > 0 && <Line k="COD fee" v={inr(order.codFee)} />}
              <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{inr(order.total)}</dd>
              </div>
            </dl>
            {order.giftNote && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">🎁 {order.giftNote}</p>}
            {order.customerNote && (
              <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-sm">
                <span className="font-medium">Customer note:</span> {order.customerNote}
              </p>
            )}
          </Card>

          <Card title="Timeline" actions={<span className="text-[12px] text-stone-500">{events.length} events</span>}>
            <NoteForm orderId={order.id} />
            <ol className="mt-6 space-y-4">
              {events.map((e) => (
                <li key={e.id} className="relative flex gap-3 text-sm">
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${eventTone[e.type] ?? "bg-stone-300"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={e.type === "email" || e.type === "stock" ? "text-stone-600" : ""}>{e.message}</p>
                    <p className="mt-0.5 text-[12px] text-stone-500">
                      {fmtDateTime(e.createdAt)} · {e.actorType === "admin" && e.actorId ? actors.get(e.actorId) ?? "admin" : e.actorType}
                      {e.isInternal ? " · internal" : " · visible to customer"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <StatusControl orderId={order.id} next={nextStatuses(order.status)} />
          </Card>

          <Card title="Customer">
            <p className="font-medium">{order.customerName}</p>
            <p className="text-sm">
              <a href={`mailto:${order.email}`} className="hover:underline">
                {order.email}
              </a>
            </p>
            <p className="text-sm">
              <a href={`tel:${order.phone}`} className="hover:underline">
                {order.phone}
              </a>
            </p>
            <p className="mt-2 text-[13px] text-stone-500">
              {customer ? (
                <Link href={`/admin/customers/${customer.id}`} className="underline underline-offset-4">
                  Registered customer{customer.emailVerifiedAt ? " (verified)" : ""}
                </Link>
              ) : (
                "Guest checkout"
              )}
            </p>
            <div className="mt-4 border-t border-stone-100 pt-4 text-sm leading-relaxed">
              <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-stone-500">Ship to</p>
              <p className="mt-1">
                {order.shipLine1}
                {order.shipLine2 && <>, {order.shipLine2}</>}
                <br />
                {order.shipCity}, {order.shipState} {order.shipPincode}
              </p>
            </div>
          </Card>

          <Card title="Payment">
            <dl className="space-y-1.5 text-sm">
              <Line k="Method" v={order.paymentMethod === "cod" ? "Cash on Delivery" : "Razorpay"} />
              <Line k="Status" v={order.paymentStatus} />
              {order.paidAt && <Line k="Paid at" v={fmtDateTime(order.paidAt)} />}
              {order.razorpayOrderId && <Line k="Razorpay order" v={order.razorpayOrderId} mono />}
              {order.razorpayPaymentId && <Line k="Payment ID" v={order.razorpayPaymentId} mono />}
            </dl>
            {pays.length > 1 && <p className="mt-2 text-[12px] text-stone-500">{pays.length} payment attempts recorded.</p>}
            {order.paymentMethod === "razorpay" && order.paymentStatus === "paid" && (
              <div className="mt-4">
                <RefundButton orderId={order.id} amount={order.total} />
              </div>
            )}
          </Card>

          <Card title="Shipment">
            <dl className="mb-4 space-y-1.5 text-sm">
              <Line k="Shiprocket order" v={order.shiprocketOrderId ?? "-"} mono />
              <Line k="AWB" v={order.awbCode ?? "-"} mono />
              <Line k="Courier" v={order.courierName ?? "-"} />
              <Line k="Courier status" v={order.trackingStatus ?? "-"} />
              {order.shippedAt && <Line k="Shipped" v={fmtDateTime(order.shippedAt)} />}
              {order.deliveredAt && <Line k="Delivered" v={fmtDateTime(order.deliveredAt)} />}
            </dl>
            <ShipmentControls orderId={order.id} canCreate={canShip} hasAwb={Boolean(order.awbCode)} configured={integrations.shiprocket()} />
            {order.awbCode && (
              <a href={publicTrackingUrl(order.awbCode)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm underline underline-offset-4">
                Public tracking page <ExternalIcon className="size-3.5" />
              </a>
            )}
          </Card>

          <Card title="Emails">
            <ResendEmail orderId={order.id} />
            <ul className="mt-4 space-y-2 text-sm">
              {emails.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate">{m.subject}</span>
                    <span className="text-[12px] text-stone-500">
                      {m.to} · {fmtDateTime(m.createdAt)}
                    </span>
                  </span>
                  <StatusBadge status={m.status === "sent" ? "delivered" : m.status === "failed" ? "failed" : "pending"} label={m.status} />
                </li>
              ))}
              {emails.length === 0 && <li className="text-stone-500">No emails yet.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Line({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{k}</dt>
      <dd className={`truncate text-right capitalize ${mono ? "font-mono text-[12px] normal-case" : ""}`}>{v}</dd>
    </div>
  );
}

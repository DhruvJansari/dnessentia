import Image from "next/image";
import Link from "next/link";
import type { orderEvents, orderItems, orders } from "@/db";
import { formatPrice } from "@/lib/format";
import { publicTrackingUrl } from "@/lib/shiprocket";
import { CheckIcon } from "../icons";
import { RetryPayment } from "./retry-payment";

type Order = typeof orders.$inferSelect & { items: (typeof orderItems.$inferSelect)[] };
type Event = typeof orderEvents.$inferSelect;

const steps = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

function stepIndex(order: Order) {
  switch (order.status) {
    case "pending":
      return 0;
    case "confirmed":
    case "processing":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return -1;
  }
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export function statusLabel(order: Pick<Order, "status" | "paymentStatus" | "paymentMethod">) {
  if (order.status === "pending" && order.paymentMethod === "razorpay") return "Awaiting payment";
  return order.status.charAt(0).toUpperCase() + order.status.slice(1);
}

export function OrderView({
  order,
  events,
  accessKey,
  thanks,
  isGuest,
}: {
  order: Order;
  events: Event[];
  accessKey: string;
  thanks: boolean;
  isGuest: boolean;
}) {
  const current = stepIndex(order);
  const awaitingPayment = order.status === "pending" && order.paymentMethod === "razorpay" && order.paymentStatus !== "paid";

  return (
    <div className="space-y-10">
      <div className="stagger-in">
        {thanks && order.status !== "pending" && (
          <p className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-sm text-gold">
            <CheckIcon className="size-4" strokeWidth={2} /> Order received
          </p>
        )}
        <h1 className="mt-4 text-5xl sm:text-6xl">
          {awaitingPayment ? (
            <>
              Complete your <em>payment</em>
            </>
          ) : thanks ? (
            <>
              Thank you, <em>{order.customerName.split(" ")[0]}</em>
            </>
          ) : (
            <>Order {order.orderNumber}</>
          )}
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          {awaitingPayment
            ? "Your order is saved. Pay securely with Razorpay to confirm it."
            : order.status === "cancelled"
              ? "This order was cancelled."
              : `We've emailed the details to ${order.email}. You'll get another email when it ships.`}
        </p>
        {awaitingPayment && <RetryPayment orderNumber={order.orderNumber} accessKey={accessKey} amount={order.total} />}
      </div>

      <dl className="reveal grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
        {[
          ["Order number", order.orderNumber],
          ["Date", dateFmt.format(order.createdAt)],
          ["Total", formatPrice(order.total)],
          ["Payment", order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentStatus === "paid" ? "Paid online" : "Razorpay (unpaid)"],
        ].map(([k, v]) => (
          <div key={k} className="bg-ivory p-4 sm:p-5">
            <dt className="text-[12px] uppercase tracking-[0.04em] text-muted">{k}</dt>
            <dd className="mt-1 font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      {current >= 0 && (
        <ol className="reveal grid grid-cols-4" aria-label="Order progress">
          {steps.map((s, i) => (
            <li key={s.key} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span aria-hidden className={`absolute right-1/2 top-4 h-px w-full ${i <= current ? "bg-gold" : "bg-line"}`} />
              )}
              <span
                className={`relative z-10 grid size-8 place-items-center rounded-full border text-sm ${
                  i <= current ? "border-gold bg-gold text-white" : "border-line bg-ivory text-muted"
                }`}
              >
                {i <= current ? <CheckIcon className="size-4" strokeWidth={2} /> : i + 1}
              </span>
              <span className={`mt-2 text-[12px] sm:text-sm ${i <= current ? "text-ink" : "text-muted"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      {order.awbCode && (
        <div className="reveal flex flex-col gap-4 border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-[0.04em] text-muted">Shipment</p>
            <p className="mt-1 font-medium">
              {order.courierName ?? "Courier"} · AWB {order.awbCode}
            </p>
            {order.trackingStatus && <p className="text-sm text-muted">Latest: {order.trackingStatus}</p>}
          </div>
          <a href={publicTrackingUrl(order.awbCode)} target="_blank" rel="noopener noreferrer" className="btn btn-dark h-11">
            Track shipment
          </a>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="reveal">
          <h2 className="text-3xl">Items</h2>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((i) => (
              <li key={i.id} className="flex gap-4 py-4">
                <span className="relative aspect-square w-16 shrink-0 bg-white">
                  {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-contain" />}
                </span>
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block font-medium">{i.name}</span>
                  <span className="block text-muted">
                    {i.variantLabel} × {i.quantity}
                  </span>
                  {i.selections?.length ? <span className="block text-[12px] text-muted">{i.selections.join(" · ")}</span> : null}
                </span>
                <span className="text-sm">{formatPrice(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between"><dt className="text-muted">Discount {order.couponCode && `(${order.couponCode})`}</dt><dd className="text-gold">− {formatPrice(order.discount)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{order.shippingFee ? formatPrice(order.shippingFee) : "Free"}</dd></div>
            {order.codFee > 0 && <div className="flex justify-between"><dt className="text-muted">COD fee</dt><dd>{formatPrice(order.codFee)}</dd></div>}
            <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-medium">Total</dt><dd className="font-serif text-3xl">{formatPrice(order.total)}</dd></div>
          </dl>
          {order.giftNote && <p className="mt-4 bg-gold/10 px-4 py-3 text-sm">🎁 {order.giftNote}</p>}
        </div>

        <div className="space-y-8">
          <div className="reveal">
            <h2 className="text-3xl">Shipping to</h2>
            <address className="mt-3 not-italic leading-relaxed text-ink-soft">
              {order.customerName}
              <br />
              {order.shipLine1}
              {order.shipLine2 && `, ${order.shipLine2}`}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPincode}
              <br />
              {order.phone}
            </address>
          </div>
          {events.length > 0 && (
            <div className="reveal">
              <h2 className="text-3xl">Updates</h2>
              <ol className="mt-4 space-y-4 border-l border-line pl-5">
                {events.map((e) => (
                  <li key={e.id} className="relative text-sm">
                    <span aria-hidden className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-ivory bg-gold" />
                    <p>{e.message}</p>
                    <p className="text-[12px] text-muted">{dateFmt.format(e.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>

      {isGuest && (
        <div className="reveal flex flex-col gap-4 bg-sand p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-3xl">Track every order in one place</h2>
            <p className="mt-1 text-ink-soft">Create an account with {order.email} and this order will appear in your history once you verify your email.</p>
          </div>
          <Link href="/register" className="btn btn-dark shrink-0">
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}

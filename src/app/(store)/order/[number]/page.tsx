import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderView } from "@/components/orders/order-view";
import { orderAccessKey } from "@/lib/orders/access";
import { getViewableOrder } from "@/lib/orders/queries";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default function OrderPage({ params, searchParams }: PageProps<"/order/[number]">) {
  return (
    <section className="container-x pb-20 pt-10 md:pb-28 md:pt-14">
      <Suspense fallback={<OrderSkeleton />}>
        <OrderContent params={params} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function OrderContent({ params, searchParams }: Pick<PageProps<"/order/[number]">, "params" | "searchParams">) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const key = typeof sp.key === "string" ? sp.key : undefined;
  const result = await getViewableOrder(number, key);
  if (!result) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-5xl">Order not found</h1>
        <p className="mt-3 text-muted">Open the link from your confirmation email, or look the order up with its number and email.</p>
        <Link href="/track" className="btn btn-dark mt-8">
          Track an order
        </Link>
      </div>
    );
  }
  const { order, events, user, isFresh } = result;
  return (
    <OrderView
      order={order}
      events={events}
      accessKey={orderAccessKey(order.orderNumber)}
      thanks={isFresh}
      isGuest={!user && !order.userId}
    />
  );
}

function OrderSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-14 w-2/3 animate-pulse bg-sand" />
      <div className="h-24 animate-pulse bg-sand/70" />
      <div className="h-64 animate-pulse bg-cream" />
    </div>
  );
}

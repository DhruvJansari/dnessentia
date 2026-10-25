import { count, desc, eq, sum } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowIcon } from "@/components/icons";
import { StatusBadge } from "@/components/orders/order-status-badge";
import { statusLabel } from "@/components/orders/order-view";
import { db, orders } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { formatPrice } from "@/lib/format";
import { ResendVerification } from "./resend-verification";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <Suspense fallback={<div className="h-72 animate-pulse bg-cream" />}>
      <Overview searchParams={searchParams} />
    </Suspense>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

async function Overview({ searchParams }: { searchParams: PageProps<"/account">["searchParams"] }) {
  const [user, sp] = await Promise.all([requireUser(), searchParams]);
  const [recent, [stats]] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(3),
    db.select({ n: count(), spent: sum(orders.total) }).from(orders).where(eq(orders.userId, user.id)),
  ]);

  const linked = Number(sp.linked ?? 0);
  const banner =
    sp.verified === "1"
      ? `Email verified.${linked > 0 ? ` ${linked} earlier order${linked > 1 ? "s were" : " was"} added to your account.` : ""}`
      : sp.verified === "invalid"
        ? "That verification link is invalid or has expired."
        : sp.reset === "1"
          ? "Your password has been updated."
          : sp.welcome === "1"
            ? "Welcome to DN Essentia! Your account is ready."
            : null;

  return (
    <div className="space-y-10">
      <div className="stagger-in">
        <p className="eyebrow">Overview</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">
          Hello, <em>{user.name.split(" ")[0] || "there"}</em>
        </h1>
        <p className="mt-2 text-ink-soft">{user.email}</p>
      </div>

      {banner && <p className="border border-gold/30 bg-gold/10 px-4 py-3 text-sm">{banner}</p>}
      {!user.emailVerified && (
        <div className="flex flex-col gap-3 border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Please verify your email</p>
            <p className="text-sm text-muted">Verifying adds any earlier guest orders placed with {user.email} to your account.</p>
          </div>
          <ResendVerification />
        </div>
      )}

      <dl className="grid grid-cols-2 gap-4">
        <div className="border border-line bg-white p-5">
          <dt className="text-sm text-muted">Orders</dt>
          <dd className="mt-1 font-serif text-4xl">{stats?.n ?? 0}</dd>
        </div>
        <div className="border border-line bg-white p-5">
          <dt className="text-sm text-muted">Total spent</dt>
          <dd className="mt-1 font-serif text-4xl">{formatPrice(Number(stats?.spent ?? 0))}</dd>
        </div>
      </dl>

      <div>
        <div className="flex items-end justify-between">
          <h2 className="text-3xl">Recent orders</h2>
          <Link href="/account/orders" className="link-underline inline-flex items-center gap-2 text-sm">
            All orders <ArrowIcon className="size-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="mt-4 border border-dashed border-line p-8 text-center">
            <p className="text-muted">No orders yet.</p>
            <Link href="/attar" className="btn btn-dark mt-5">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="reveal-stagger mt-4 divide-y divide-line border-y border-line">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/order/${o.orderNumber}`} className="group flex flex-wrap items-center justify-between gap-3 py-4">
                  <span>
                    <span className="block font-medium">{o.orderNumber}</span>
                    <span className="text-sm text-muted">{dateFmt.format(o.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <StatusBadge status={o.status} label={statusLabel(o)} />
                    <span className="w-20 text-right">{formatPrice(o.total)}</span>
                    <ArrowIcon className="size-4 text-muted" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

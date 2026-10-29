import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CustomerActions } from "@/components/admin/customer-actions";
import { Card, Empty, fmtDateTime, inr, Skeleton, Stat, Table, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/orders/order-status-badge";
import { updateUserDetailsAction } from "@/app/admin/customers/actions";
import { SessionActions, UserDetailsForm } from "@/components/admin/user-forms";
import { addresses, auditLogs, db, orders, sessions, users } from "@/db";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Customer" };

export default function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  return (
    <Suspense fallback={<Skeleton rows={2} />}>
      <Customer params={params} />
    </Suspense>
  );
}

async function Customer({ params }: { params: PageProps<"/admin/customers/[id]">["params"] }) {
  const actor = await requireStaff();
  const id = Number((await params).id);
  const user = Number.isInteger(id) ? await db.query.users.findFirst({ where: eq(users.id, id) }) : null;
  if (!user) notFound();

  const [orderRows, addressRows, history, devices] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, id)).orderBy(desc(orders.createdAt)),
    db.select().from(addresses).where(eq(addresses.userId, id)),
    db.select().from(auditLogs).where(and(eq(auditLogs.entityType, "user"), eq(auditLogs.entityId, String(id)))).orderBy(desc(auditLogs.createdAt)).limit(10),
    db.select().from(sessions).where(eq(sessions.userId, id)).orderBy(desc(sessions.createdAt)).limit(10),
  ]);
  const canEdit = user.role === "customer" || actor.role === "admin";
  const paid = orderRows.filter((o) => o.kind === "standard" && ["confirmed", "processing", "shipped", "delivered"].includes(o.status));
  const spent = paid.reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/customers" className="text-sm text-stone-500 hover:text-stone-900">
          ← Customers
        </Link>
        <h1 className="mt-2 font-serif text-4xl leading-none">{user.name || user.email}</h1>
        <p className="mt-2 text-sm text-stone-500">
          {user.email}
          {user.phone ? ` · ${user.phone}` : ""} · joined {fmtDateTime(user.createdAt)} · last login {fmtDateTime(user.lastLoginAt)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={orderRows.length} />
        <Stat label="Lifetime spend" value={inr(spent)} />
        <Stat label="Average order" value={inr(paid.length ? Math.round(spent / paid.length) : 0)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Orders" padded={false}>
          {orderRows.length === 0 ? (
            <Empty title="No orders yet" />
          ) : (
            <Table head={["Order", "Status", "Payment", "Total", "Placed"]}>
              {orderRows.map((o) => (
                <tr key={o.id} className="relative hover:bg-stone-50">
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-medium after:absolute after:inset-0">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td>
                    <StatusBadge status={o.paymentStatus} />
                  </Td>
                  <Td className="tabular-nums">{o.kind === "replacement" ? <span className="text-stone-500">Replacement</span> : inr(o.total)}</Td>
                  <Td className="text-stone-500">{fmtDateTime(o.createdAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Account">
            <dl className="mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-stone-500">Status</dt><dd>{user.isActive ? "Active" : "Disabled"}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Email</dt><dd>{user.emailVerifiedAt ? "Verified" : "Not verified"}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-500">Role</dt><dd className="capitalize">{user.role}</dd></div>
            </dl>
            <CustomerActions
              userId={user.id}
              isActive={user.isActive}
              role={user.role}
              verified={Boolean(user.emailVerifiedAt)}
              canChangeRole={actor.role === "admin" && actor.id !== user.id}
            />
          </Card>
          {canEdit && (
            <Card title="Details">
              <UserDetailsForm action={updateUserDetailsAction.bind(null, user.id)} defaults={{ name: user.name, email: user.email, phone: user.phone ?? "" }} />
            </Card>
          )}
          <Card title="Signed-in devices" actions={<span className="text-[12px] text-stone-500">{devices.length} active</span>}>
            {devices.length === 0 ? (
              <p className="mb-3 text-sm text-stone-500">Not signed in anywhere right now.</p>
            ) : (
              <ul className="mb-4 space-y-2 text-sm">
                {devices.map((d) => (
                  <li key={d.id}>
                    <p className="truncate">{deviceName(d.userAgent)}</p>
                    <p className="text-[12px] text-stone-500">
                      Since {fmtDateTime(d.createdAt)}
                      {d.ip ? ` · IP ${d.ip}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {canEdit && <SessionActions userId={user.id} verified={Boolean(user.emailVerifiedAt)} />}
          </Card>
          <Card title="Addresses">
            {addressRows.length === 0 ? (
              <p className="text-sm text-stone-500">No saved addresses.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {addressRows.map((a) => (
                  <li key={a.id}>
                    <p className="font-medium">
                      {a.name} {a.isDefault && <span className="text-[11px] text-amber-700">default</span>}
                    </p>
                    <p className="text-stone-600">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode} · {a.phone}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Admin history">
            {history.length === 0 ? (
              <p className="text-sm text-stone-500">No admin changes to this account.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {history.map((h) => (
                  <li key={h.id}>
                    {h.summary}
                    <span className="block text-[12px] text-stone-500">
                      {h.actorEmail} · {fmtDateTime(h.createdAt)}
                    </span>
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

/** "Chrome on Windows"-style label from a user agent string. */
function deviceName(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = ua.includes("Edg/") ? "Edge" : ua.includes("Chrome/") ? "Chrome" : ua.includes("Firefox/") ? "Firefox" : ua.includes("Safari/") ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

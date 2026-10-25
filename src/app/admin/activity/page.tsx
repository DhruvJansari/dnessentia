import { count, desc } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, fmtDateTime, PageTitle, Pagination, Skeleton, Table, Tabs, Td, PAGE } from "@/components/admin/ui";
import { auditLogs, db, webhookEvents } from "@/db";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Activity" };

export default function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  return (
    <>
      <PageTitle title="Activity" description="Who changed what in the admin, and every webhook received from Razorpay and Shiprocket." />
      <Suspense fallback={<Skeleton rows={1} />}>
        <ActivityLog searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const entityHref = (type: string, id: string | null) =>
  !id ? null : type === "order" ? `/admin/orders/${id}` : type === "product" ? `/admin/products/${id}` : type === "user" ? `/admin/customers/${id}` : null;

const webhookTone = { received: "bg-stone-100 text-stone-600", processed: "bg-emerald-50 text-emerald-800", ignored: "bg-stone-100 text-stone-500", failed: "bg-red-50 text-red-800" };

async function ActivityLog({ searchParams }: { searchParams: PageProps<"/admin/activity">["searchParams"] }) {
  await requireStaff();
  const sp = await searchParams;
  const tab = sp.tab === "webhooks" ? "webhooks" : "admin";
  const page = Math.max(1, Number(sp.page ?? 1));
  const tabs = (
    <Tabs
      active={tab}
      items={[
        { key: "admin", label: "Admin actions", href: "/admin/activity" },
        { key: "webhooks", label: "Webhooks", href: "/admin/activity?tab=webhooks" },
      ]}
    />
  );
  const pageHref = (p: number) => `/admin/activity?${new URLSearchParams({ ...(tab === "webhooks" ? { tab } : {}), page: String(p) })}`;

  if (tab === "webhooks") {
    const [rows, [{ n }]] = await Promise.all([
      db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
      db.select({ n: count() }).from(webhookEvents),
    ]);
    return (
      <>
        {tabs}
        <Card padded={false}>
          {rows.length === 0 ? (
            <Empty title="No webhooks received yet" text="Configure the webhook URLs in Razorpay and Shiprocket (see Settings)." />
          ) : (
            <Table head={["Provider", "Event", "Reference", "Result", "Received"]}>
              {rows.map((w) => (
                <tr key={w.id} className="hover:bg-stone-50">
                  <Td className="capitalize">{w.provider}</Td>
                  <Td className="font-mono text-[12px]">{w.eventType}</Td>
                  <Td className="font-mono text-[12px] text-stone-500">{w.externalId ?? "-"}</Td>
                  <Td>
                    <span className={`rounded-full px-2 py-0.5 text-[12px] ${webhookTone[w.status]}`} title={w.error ?? undefined}>
                      {w.status}
                    </span>
                  </Td>
                  <Td className="text-stone-500">{fmtDateTime(w.createdAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
          <Pagination page={page} pages={Math.max(1, Math.ceil(n / PAGE))} makeHref={pageHref} />
        </Card>
      </>
    );
  }

  const [rows, [{ n }]] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ n: count() }).from(auditLogs),
  ]);
  return (
    <>
      {tabs}
      <Card padded={false}>
        {rows.length === 0 ? (
          <Empty title="No admin actions yet" text="Changes to orders, products, coupons, customers and settings are recorded here." />
        ) : (
          <Table head={["When", "Who", "Action", "What changed"]}>
            {rows.map((a) => {
              const href = entityHref(a.entityType, a.entityId);
              return (
                <tr key={a.id} className="align-top hover:bg-stone-50">
                  <Td className="text-stone-500">{fmtDateTime(a.createdAt)}</Td>
                  <Td>
                    {a.actorEmail ?? "System"}
                    {a.ip && <span className="block text-[11px] text-stone-400">{a.ip}</span>}
                  </Td>
                  <Td className="font-mono text-[12px]">{a.action}</Td>
                  <Td className="whitespace-normal">
                    {href ? (
                      <Link href={href} className="hover:underline">
                        {a.summary}
                      </Link>
                    ) : (
                      a.summary
                    )}
                    {a.changes && Object.keys(a.changes).length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[12px] text-stone-500">Details</summary>
                        <pre className="mt-1 max-w-xl overflow-x-auto rounded-lg bg-stone-50 p-2 text-[11px] leading-relaxed">{JSON.stringify(a.changes, null, 2)}</pre>
                      </details>
                    )}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
        <Pagination page={page} pages={Math.max(1, Math.ceil(n / PAGE))} makeHref={pageHref} />
      </Card>
    </>
  );
}

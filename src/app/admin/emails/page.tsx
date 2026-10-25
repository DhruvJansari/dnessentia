import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, fmtDateTime, PageTitle, Pagination, Skeleton, Table, Tabs, Td, PAGE } from "@/components/admin/ui";
import { db, emailLogs } from "@/db";
import { requireStaff } from "@/lib/auth/session";
import { integrations } from "@/lib/env";

export const metadata = { title: "Emails" };

export default function EmailsPage({ searchParams }: PageProps<"/admin/emails">) {
  return (
    <>
      <PageTitle title="Emails" description="Every email the store has sent or tried to send, with delivery status." />
      <Suspense fallback={<Skeleton rows={1} />}>
        <EmailTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const tone = { sent: "bg-emerald-50 text-emerald-800", failed: "bg-red-50 text-red-800", skipped: "bg-stone-100 text-stone-600" };

async function EmailTable({ searchParams }: { searchParams: PageProps<"/admin/emails">["searchParams"] }) {
  await requireStaff();
  const sp = await searchParams;
  const status = sp.status === "sent" || sp.status === "failed" || sp.status === "skipped" ? sp.status : "all";
  const page = Math.max(1, Number(sp.page ?? 1));
  const where = status === "all" ? undefined : eq(emailLogs.status, status);
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(emailLogs).where(where).orderBy(desc(emailLogs.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ n: count() }).from(emailLogs).where(where),
  ]);

  return (
    <>
      {!integrations.smtp() && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          SMTP isn&apos;t configured, so emails are logged as &quot;skipped&quot; and printed to the server console. Add SMTP_* to .env.local.
        </p>
      )}
      <Tabs
        active={status}
        items={(["all", "sent", "failed", "skipped"] as const).map((s) => ({ key: s, label: s[0].toUpperCase() + s.slice(1), href: s === "all" ? "/admin/emails" : `/admin/emails?status=${s}` }))}
      />
      <Card padded={false}>
        {rows.length === 0 ? (
          <Empty title="No emails here yet" />
        ) : (
          <Table head={["Status", "To", "Subject", "Template", "Order", "Sent"]}>
            {rows.map((m) => (
              <tr key={m.id} className="hover:bg-stone-50">
                <Td>
                  <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${tone[m.status]}`} title={m.error ?? undefined}>
                    {m.status}
                  </span>
                </Td>
                <Td>{m.to}</Td>
                <Td className="max-w-[320px] truncate">
                  {m.subject}
                  {m.error && <span className="block truncate text-[12px] text-red-700">{m.error}</span>}
                </Td>
                <Td className="font-mono text-[12px] text-stone-500">{m.template}</Td>
                <Td>
                  {m.orderId ? (
                    <Link href={`/admin/orders/${m.orderId}`} className="underline underline-offset-4">
                      View
                    </Link>
                  ) : (
                    "-"
                  )}
                </Td>
                <Td className="text-stone-500">{fmtDateTime(m.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
        <Pagination page={page} pages={Math.max(1, Math.ceil(n / PAGE))} makeHref={(p) => `/admin/emails?${new URLSearchParams({ ...(status !== "all" ? { status } : {}), page: String(p) })}`} />
      </Card>
    </>
  );
}

import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { Card, Empty, fmtDateTime, PageTitle, Skeleton, Table, Tabs, Td } from "@/components/admin/ui";
import { StatusBadge } from "@/components/orders/order-status-badge";
import { db, orders, replacementRequests } from "@/db";
import { requireStaff } from "@/lib/auth/session";
import { replacementReasonLabel } from "@/lib/mail/templates";

export const metadata = { title: "Replacements" };

export default function ReplacementsPage({ searchParams }: PageProps<"/admin/replacements">) {
  return (
    <>
      <PageTitle title="Replacements" description="Damaged, leaked, wrong or missing items reported by customers. Open the order to review photos and decide." />
      <Suspense fallback={<Skeleton rows={1} />}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const tone = { requested: "pending", approved: "confirmed", rejected: "cancelled", completed: "delivered" } as const;

async function List({ searchParams }: { searchParams: PageProps<"/admin/replacements">["searchParams"] }) {
  await requireStaff();
  const sp = await searchParams;
  const status = (["requested", "approved", "rejected", "completed"] as const).find((s) => s === sp.status) ?? "requested";
  const rows = await db
    .select({ r: replacementRequests, orderNumber: orders.orderNumber, customer: orders.customerName })
    .from(replacementRequests)
    .innerJoin(orders, eq(orders.id, replacementRequests.orderId))
    .where(eq(replacementRequests.status, status))
    .orderBy(desc(replacementRequests.createdAt))
    .limit(100);

  return (
    <>
      <Tabs
        active={status}
        items={[
          { key: "requested", label: "To review", href: "/admin/replacements" },
          { key: "approved", label: "Approved", href: "/admin/replacements?status=approved" },
          { key: "completed", label: "Completed", href: "/admin/replacements?status=completed" },
          { key: "rejected", label: "Rejected", href: "/admin/replacements?status=rejected" },
        ]}
      />
      <Card padded={false}>
        {rows.length === 0 ? (
          <Empty title="Nothing here" text="Replacement requests from customers show up here." />
        ) : (
          <Table head={["Order", "Customer", "Problem", "Evidence", "Status", "Requested"]}>
            {rows.map(({ r, orderNumber, customer }) => (
              <tr key={r.id} className="relative hover:bg-stone-50">
                <Td>
                  <Link href={`/admin/orders/${r.orderId}`} className="font-medium after:absolute after:inset-0">
                    {orderNumber}
                  </Link>
                </Td>
                <Td>{customer}</Td>
                <Td>{replacementReasonLabel(r.reason)}</Td>
                <Td className="text-stone-600">
                  {r.photos.length} photo{r.photos.length === 1 ? "" : "s"}
                  {r.videoUrl ? " · video" : ""}
                </Td>
                <Td>
                  <StatusBadge status={tone[r.status]} label={r.status} />
                </Td>
                <Td className="text-stone-500">{fmtDateTime(r.createdAt)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

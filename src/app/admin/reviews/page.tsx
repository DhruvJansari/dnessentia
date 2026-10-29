import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { ReviewControls } from "@/components/admin/review-controls";
import { Card, Empty, fmtDateTime, PageTitle, Skeleton, Tabs } from "@/components/admin/ui";
import { Stars } from "@/components/stars";
import { db, products, reviews } from "@/db";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Reviews" };

export default function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  return (
    <>
      <PageTitle title="Reviews" description="Verified buyers are published automatically. Other reviews wait here for your approval." />
      <Suspense fallback={<Skeleton rows={2} />}>
        <ReviewList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ReviewList({ searchParams }: { searchParams: PageProps<"/admin/reviews">["searchParams"] }) {
  await requireStaff();
  const sp = await searchParams;
  const status = sp.status === "approved" || sp.status === "rejected" ? sp.status : "pending";
  const [rows, counts] = await Promise.all([
    db
      .select({ review: reviews, productName: products.name, slug: products.slug })
      .from(reviews)
      .innerJoin(products, eq(products.id, reviews.productId))
      .where(eq(reviews.status, status))
      .orderBy(desc(reviews.createdAt))
      .limit(100),
    db.select({ status: reviews.status, n: count() }).from(reviews).groupBy(reviews.status),
  ]);
  const n = Object.fromEntries(counts.map((c) => [c.status, c.n]));

  return (
    <>
      <Tabs
        active={status}
        items={[
          { key: "pending", label: "Waiting for approval", count: n.pending ?? 0, href: "/admin/reviews" },
          { key: "approved", label: "Published", count: n.approved ?? 0, href: "/admin/reviews?status=approved" },
          { key: "rejected", label: "Hidden", count: n.rejected ?? 0, href: "/admin/reviews?status=rejected" },
        ]}
      />
      {rows.length === 0 ? (
        <Card>
          <Empty title={status === "pending" ? "Nothing to approve" : "No reviews here"} text="New reviews appear here as customers write them." />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rows.map(({ review: r, productName, slug }) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={r.rating} className="size-4" />
                <span className="text-[12px] text-stone-500">{fmtDateTime(r.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm">
                <Link href={`/product/${slug}#reviews`} target="_blank" className="font-medium underline-offset-4 hover:underline">
                  {productName}
                </Link>{" "}
                · {r.name}
                {r.verifiedPurchase && <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-800">Verified buyer</span>}
              </p>
              {r.title && <p className="mt-3 font-medium">{r.title}</p>}
              <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{r.body}</p>
              {r.adminReply && <p className="mt-3 border-l-2 border-amber-300 pl-3 text-sm text-stone-600">Your reply: {r.adminReply}</p>}
              <ReviewControls id={r.id} status={r.status} reply={r.adminReply} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

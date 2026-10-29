import Link from "next/link";
import { Suspense } from "react";
import { Stars } from "@/components/stars";
import type { Rating } from "@/data/types";
import { getSessionUser } from "@/lib/auth/session";
import { getProductReviews } from "@/lib/catalog";
import { ReviewForm } from "./review-form";

const dateFmt = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

/** Rating summary, review list and the write-a-review form for a product page. */
export async function ProductReviews({ productId, productName, slug, rating }: { productId: number; productName: string; slug: string; rating: Rating | null }) {
  const list = await getProductReviews(productId);
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, n: list.filter((r) => r.rating === star).length }));

  return (
    <section id="reviews" className="section-y scroll-mt-24 border-t border-line">
      <div className="container-x grid gap-12 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-20">
        <div className="reveal">
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-3 text-[2.5rem] sm:text-5xl">
            What people <em>say</em>
          </h2>
          {rating ? (
            <>
              <div className="mt-6 flex items-center gap-4">
                <p className="font-serif text-6xl leading-none">{rating.average.toFixed(1)}</p>
                <div>
                  <Stars value={rating.average} className="size-5" />
                  <p className="mt-1 text-sm text-muted">
                    {rating.count} review{rating.count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <ul className="mt-6 space-y-1.5">
                {dist.map((d) => (
                  <li key={d.star} className="flex items-center gap-3 text-[13px]">
                    <span className="w-8 text-muted">{d.star} ★</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${list.length ? (d.n / list.length) * 100 : 0}%` }} />
                    </span>
                    <span className="w-6 text-right tabular-nums text-muted">{d.n}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-muted">No reviews yet. Be the first to share how {productName} wears on you.</p>
          )}
          <div className="mt-8">
            <Suspense fallback={null}>
              <WriteReview productId={productId} slug={slug} />
            </Suspense>
          </div>
        </div>

        <ul className="reveal-stagger space-y-4">
          {list.map((r) => (
            <li key={r.id} className="border border-line bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={r.rating} />
                <span className="text-[12px] text-muted">{dateFmt.format(new Date(r.createdAt))}</span>
              </div>
              {r.title && <p className="mt-3 font-medium">{r.title}</p>}
              <p className="mt-2 whitespace-pre-line text-ink-soft">{r.body}</p>
              <p className="mt-3 text-[13px] text-muted">
                {r.name}
                {r.verifiedPurchase && <span className="ml-2 rounded-full bg-gold/15 px-2 py-0.5 text-[11px] text-gold">Verified buyer</span>}
              </p>
              {r.adminReply && (
                <p className="mt-4 border-l-2 border-gold/40 pl-3 text-sm text-ink-soft">
                  <span className="font-medium text-ink">DN Essentia: </span>
                  {r.adminReply}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function WriteReview({ productId, slug }: { productId: number; slug: string }) {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/product/${slug}#reviews`)}`} className="btn btn-outline">
        Log in to write a review
      </Link>
    );
  }
  return <ReviewForm productId={productId} />;
}

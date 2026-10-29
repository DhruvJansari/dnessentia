import "server-only";
import { and, asc, avg, count, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, products, reviews } from "@/db";
import type { Attar, Combo, ProductSummary, Rating } from "@/data/types";

/** Cache tag for everything the storefront reads from the catalog. Admin product edits call updateTag(CATALOG_TAG). */
export const CATALOG_TAG = "catalog";

type Catalog = { attars: Attar[]; combos: Combo[] };

async function loadCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const rows = await db.query.products.findMany({
    where: eq(products.isActive, true),
    orderBy: [asc(products.sortOrder), asc(products.id)],
    with: { variants: { where: (v, { eq }) => eq(v.isActive, true), orderBy: (v, { asc }) => [asc(v.sortOrder), asc(v.id)] } },
  });

  const ratingRows = await db
    .select({ productId: reviews.productId, average: avg(reviews.rating), n: count() })
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .groupBy(reviews.productId);
  const ratings = new Map<number, Rating>(
    ratingRows.map((r) => [r.productId, { average: Math.round(Number(r.average) * 10) / 10, count: r.n }]),
  );

  const attars: Attar[] = [];
  const combos: Combo[] = [];
  for (const p of rows) {
    if (p.variants.length === 0) continue;
    if (p.type === "attar") {
      attars.push({
        id: p.id,
        rating: ratings.get(p.id) ?? null,
        slug: p.slug,
        name: p.name,
        image: p.images[0] ?? "/images/brand/logo-square.jpg",
        gallery: p.images.length ? p.images : ["/images/brand/logo-square.jpg"],
        character: p.character,
        bestFor: p.bestFor,
        notes: p.notes ?? { top: [], heart: [], base: [] },
        about: p.about,
        categories: p.isBestSeller ? ["Best Seller", ...p.categories] : p.categories,
        sizes: p.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, stock: v.stock })),
      });
    } else {
      const v = p.variants[0];
      combos.push({
        id: p.id,
        rating: ratings.get(p.id) ?? null,
        slug: p.slug,
        name: p.name,
        image: p.images[0] ?? "/images/brand/logo-square.jpg",
        variantId: v.id,
        variantLabel: v.label,
        stock: v.stock,
        price: v.price,
        regularPrice: v.compareAtPrice ?? v.price,
        pick: p.pickCount ?? 7,
        sizeMl: p.sizeMl ?? 1,
        includes: p.includes ?? [],
        about: p.about,
        perfectFor: p.perfectFor ?? [],
        howToUse: p.howToUse ?? "",
        whyChoose: p.whyChoose ?? [],
      });
    }
  }
  return { attars, combos };
}

export async function getAttars() {
  return (await loadCatalog()).attars;
}

export async function getCombos() {
  return (await loadCatalog()).combos;
}

export async function getAttarBySlug(slug: string) {
  return (await getAttars()).find((a) => a.slug === slug) ?? null;
}

export async function getComboBySlug(slug: string) {
  return (await getCombos()).find((c) => c.slug === slug) ?? null;
}

export async function getBestSellers() {
  return (await getAttars()).filter((a) => a.categories.includes("Best Seller")).slice(0, 4);
}

export async function getAllSlugs() {
  const { attars, combos } = await loadCatalog();
  return [...attars, ...combos].map((p) => p.slug);
}

/** Compact index of every live product for client-side features. */
export async function getProductIndex(): Promise<ProductSummary[]> {
  const { attars, combos } = await loadCatalog();
  return [
    ...attars.map((a) => {
      const quick = a.sizes.find((s) => s.stock > 0) ?? null;
      return {
        id: a.id,
        slug: a.slug,
        type: "attar" as const,
        name: a.name,
        image: a.image,
        subtitle: a.character,
        priceFrom: a.sizes[0]?.price ?? 0,
        keywords: [a.name, a.character, a.bestFor, ...a.categories, ...a.notes.top, ...a.notes.heart, ...a.notes.base].join(" ").toLowerCase(),
        rating: a.rating,
        quickVariant: quick ? { id: quick.id, label: quick.label, price: quick.price } : null,
      };
    }),
    ...combos.map((c) => ({
      id: c.id,
      slug: c.slug,
      type: "combo" as const,
      name: c.name,
      image: c.image,
      subtitle: c.pick >= 7 ? `All 7 attars, ${c.sizeMl} ml each` : `Choose any ${c.pick}, ${c.sizeMl} ml each`,
      priceFrom: c.price,
      keywords: [c.name, "combo gift set pack", ...c.includes].join(" ").toLowerCase(),
      rating: c.rating,
      quickVariant: null,
    })),
  ];
}

export type PublicReview = {
  id: number;
  name: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  adminReply: string | null;
  createdAt: string;
};

/** Approved reviews for a product page, newest first. */
export async function getProductReviews(productId: number): Promise<PublicReview[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verifiedPurchase: r.verifiedPurchase,
    adminReply: r.adminReply,
    createdAt: r.createdAt.toISOString(),
  }));
}

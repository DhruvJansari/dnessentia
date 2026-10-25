import "server-only";
import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, products } from "@/db";
import type { Attar, Combo } from "@/data/types";

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

  const attars: Attar[] = [];
  const combos: Combo[] = [];
  for (const p of rows) {
    if (p.variants.length === 0) continue;
    if (p.type === "attar") {
      attars.push({
        id: p.id,
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

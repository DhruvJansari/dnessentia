import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductEditor } from "@/components/admin/product-editor";
import { PageTitle, Skeleton } from "@/components/admin/ui";
import { db, products } from "@/db";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Edit product" };

export default function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  return (
    <Suspense fallback={<Skeleton rows={2} />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/products/[id]">["params"] }) {
  await requireStaff();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const p = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { variants: { orderBy: (v, { asc }) => [asc(v.sortOrder), asc(v.id)] } },
  });
  if (!p) notFound();

  return (
    <>
      <PageTitle title={p.name} description={`${p.type === "attar" ? "Attar" : "Combo pack"} · last updated ${p.updatedAt.toLocaleDateString("en-IN")}`} />
      <ProductEditor
        initial={{
          id: p.id,
          type: p.type,
          name: p.name,
          slug: p.slug,
          character: p.character,
          bestFor: p.bestFor,
          about: p.about,
          notes: p.notes ?? { top: [], heart: [], base: [] },
          categories: p.categories,
          images: p.images,
          pickCount: p.pickCount,
          sizeMl: p.sizeMl,
          includes: p.includes ?? [],
          perfectFor: p.perfectFor ?? [],
          howToUse: p.howToUse ?? "",
          whyChoose: p.whyChoose ?? [],
          isActive: p.isActive,
          isBestSeller: p.isBestSeller,
          sortOrder: p.sortOrder,
          seoTitle: p.seoTitle ?? "",
          seoDescription: p.seoDescription ?? "",
          variants: p.variants.map((v) => ({
            id: v.id,
            label: v.label,
            sku: v.sku,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            weightGrams: v.weightGrams,
            isActive: v.isActive,
          })),
        }}
      />
    </>
  );
}

import { Suspense } from "react";
import { ProductEditor } from "@/components/admin/product-editor";
import { PageTitle, Skeleton } from "@/components/admin/ui";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "New product" };

export default function NewProductPage({ searchParams }: PageProps<"/admin/products/new">) {
  return (
    <Suspense fallback={<Skeleton rows={2} />}>
      <NewEditor searchParams={searchParams} />
    </Suspense>
  );
}

async function NewEditor({ searchParams }: { searchParams: PageProps<"/admin/products/new">["searchParams"] }) {
  await requireStaff();
  const type = (await searchParams).type === "combo" ? "combo" : "attar";
  return (
    <>
      <PageTitle title={type === "combo" ? "New combo pack" : "New attar"} description="Fill in the details, add variants and images, then create." />
      <ProductEditor
        initial={{
          type,
          name: "",
          slug: "",
          character: "",
          bestFor: "",
          about: "",
          notes: { top: [], heart: [], base: [] },
          categories: type === "combo" ? ["Combo"] : [],
          images: [],
          pickCount: type === "combo" ? 3 : null,
          sizeMl: type === "combo" ? 1 : null,
          includes: [],
          perfectFor: [],
          howToUse: "",
          whyChoose: [],
          isActive: true,
          isBestSeller: false,
          sortOrder: type === "combo" ? 200 : 50,
          seoTitle: "",
          seoDescription: "",
          variants:
            type === "combo"
              ? [{ label: "3 × 1 ml", sku: "", price: 0, compareAtPrice: null, stock: 0, weightGrams: 150, isActive: true }]
              : ["1 ml", "3 ml", "6 ml"].map((label, i) => ({ label, sku: "", price: 0, compareAtPrice: null, stock: 0, weightGrams: 30 + i * 15, isActive: true })),
        }}
      />
    </>
  );
}

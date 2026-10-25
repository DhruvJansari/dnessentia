import { asc, eq } from "drizzle-orm";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ProductActiveToggle } from "@/components/admin/product-toggle";
import { btn, Card, Empty, inr, PageTitle, Skeleton, Table, Tabs, Td } from "@/components/admin/ui";
import { db, products } from "@/db";
import { requireStaff } from "@/lib/auth/session";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageTitle
        title="Products"
        description="Prices, stock and content. Changes go live on the store immediately."
        actions={
          <>
            <Link href="/admin/products/new?type=combo" className={btn.secondary}>
              New combo
            </Link>
            <Link href="/admin/products/new?type=attar" className={btn.primary}>
              New attar
            </Link>
          </>
        }
      />
      <Suspense fallback={<Skeleton rows={1} />}>
        <ProductTable searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductTable({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  await requireStaff();
  const { type = "all" } = (await searchParams) as { type?: string };
  const [rows, settings] = await Promise.all([
    db.query.products.findMany({
      where: type === "attar" || type === "combo" ? eq(products.type, type) : type === "hidden" ? eq(products.isActive, false) : undefined,
      orderBy: [asc(products.sortOrder), asc(products.id)],
      with: { variants: { orderBy: (v, { asc }) => [asc(v.sortOrder)] } },
    }),
    getSettings(),
  ]);
  const low = settings.store.lowStockThreshold;

  return (
    <>
      <Tabs
        active={type}
        items={[
          { key: "all", label: "All", href: "/admin/products" },
          { key: "attar", label: "Attars", href: "/admin/products?type=attar" },
          { key: "combo", label: "Combos", href: "/admin/products?type=combo" },
          { key: "hidden", label: "Hidden", href: "/admin/products?type=hidden" },
        ]}
      />
      <Card padded={false}>
        {rows.length === 0 ? (
          <Empty title="No products here" />
        ) : (
          <Table head={["Product", "Type", "Variants · price · stock", "Visible", ""]}>
            {rows.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-stone-50">
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-stone-50">
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-contain" />}
                    </span>
                    <span>
                      <span className="block font-medium hover:underline">{p.name}</span>
                      <span className="text-[12px] text-stone-500">/{p.slug}</span>
                      {p.isBestSeller && <span className="ml-2 rounded bg-amber-50 px-1.5 text-[11px] text-amber-800">Best seller</span>}
                    </span>
                  </Link>
                </Td>
                <Td className="capitalize text-stone-600">{p.type}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {p.variants.map((v) => (
                      <span
                        key={v.id}
                        className={`rounded-md px-2 py-1 text-[12px] ring-1 ring-inset ${
                          !v.isActive ? "text-stone-400 ring-stone-200 line-through" : v.stock <= 0 ? "bg-red-50 text-red-800 ring-red-200" : v.stock <= low ? "bg-amber-50 text-amber-800 ring-amber-200" : "ring-stone-200"
                        }`}
                      >
                        {v.label} · {inr(v.price)} · {v.stock}
                      </span>
                    ))}
                  </div>
                </Td>
                <Td>
                  <ProductActiveToggle id={p.id} active={p.isActive} />
                </Td>
                <Td className="text-right">
                  <Link href={`/admin/products/${p.id}`} className={btn.ghost}>
                    Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

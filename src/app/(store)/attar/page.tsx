import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { ProductCard } from "@/components/product-card";
import { getAttars } from "@/lib/catalog";
import { AttarGrid } from "./attar-grid";

export const metadata: Metadata = {
  title: "Attars | Premium Alcohol-Free Perfume Oils",
  description:
    "Shop all DN Essentia attars: Royal Oud, Musk Velvet, Urban Man, The Touch, Aqua Mist, Oud Legacy and Pure Apeal. Alcohol-free, long-lasting, from ₹59.",
};

export default async function AttarPage() {
  const attars = await getAttars();
  const cards = Object.fromEntries(attars.map((a, i) => [a.slug, <ProductCard key={a.slug} attar={a} priority={i < 4} />]));
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Attar" }]}
        eyebrow="The Collection"
        title={
          <>
            Seven attars. <em>Each one unforgettable.</em>
          </>
        }
        description="Every DN Essentia attar is chosen from 100+ fragrances. Concentrated, alcohol-free and available in 1 ml, 3 ml and 6 ml."
      />
      <section className="container-x pb-20 md:pb-28">
        <AttarGrid attars={attars} cards={cards} />

        <div className="mt-20 flex flex-col items-start justify-between gap-6 bg-sand p-8 sm:p-10 md:flex-row md:items-center lg:p-14">
          <div>
            <p className="eyebrow">Can&apos;t pick just one?</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">
              Try them all in a <em>combo pack</em>
            </h2>
          </div>
          <Link href="/combo-collection" className="btn btn-dark">
            Shop Combos <ArrowIcon className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

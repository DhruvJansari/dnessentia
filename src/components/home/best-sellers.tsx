import Link from "next/link";
import { getBestSellers } from "@/lib/catalog";
import { ArrowIcon } from "../icons";
import { ProductCard } from "../product-card";
import { SectionHeading } from "../section-heading";

export async function BestSellers() {
  const items = await getBestSellers();
  return (
    <section className="section-y">
      <div className="container-x">
        <SectionHeading
          align="left"
          eyebrow="Our Best Sellers"
          title={
            <>
              Find your <em>signature</em> scent
            </>
          }
          description="Handpicked attars loved by our customers. Long-lasting, alcohol-free and made to be remembered."
          action={
            <Link href="/attar" className="link-underline inline-flex w-fit items-center gap-2 pb-1 text-[13px] uppercase tracking-[0.04em]">
              Shop all attars <ArrowIcon className="size-4" />
            </Link>
          }
        />
        <div className="reveal-stagger mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:mt-16 lg:grid-cols-4">
          {items.map((attar) => (
            <ProductCard key={attar.slug} attar={attar} />
          ))}
        </div>
      </div>
    </section>
  );
}

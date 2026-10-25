import Link from "next/link";
import { getCombos } from "@/lib/catalog";
import { ComboCard } from "../combo-card";
import { ArrowIcon } from "../icons";
import { SectionHeading } from "../section-heading";

export async function Collections() {
  const [first, second, ...rest] = await getCombos();
  if (!first || !second) return null;
  return (
    <section className="jaali section-y bg-cream">
      <div className="container-x">
        <SectionHeading
          eyebrow="Our Signature Collections"
          title={
            <>
              Find your perfect <em>fragrance collection</em>
            </>
          }
          description="Curated attar sets for every moment. Explore the range, build your wardrobe, or gift something unforgettable."
        />

        <div className="reveal-stagger mt-12 grid gap-4 sm:gap-6 md:mt-16 md:grid-cols-2">
          <ComboCard combo={first} featured />
          <ComboCard combo={second} featured />
        </div>
        <div className="reveal-stagger mt-4 grid grid-cols-2 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-4">
          {rest.map((combo) => (
            <ComboCard key={combo.slug} combo={combo} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/combo-collection" className="btn btn-outline">
            View All Combos <ArrowIcon className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

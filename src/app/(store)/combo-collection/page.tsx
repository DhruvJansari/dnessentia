import type { Metadata } from "next";
import { ComboCard } from "@/components/combo-card";
import { PageHeader } from "@/components/page-header";
import { getCombos } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Combo Collection | Attar Gift Sets & Discovery Packs",
  description:
    "Build your fragrance wardrobe with DN Essentia combo packs. Discovery, Trial, Explorer, Premium, Luxury and the Ultimate Collection. Save up to 67%.",
};

const steps = [
  { n: "01", title: "Choose a pack", text: "Pick how many attars and which size suits you, from 1 ml testers to 6 ml bottles." },
  { n: "02", title: "Select your scents", text: "Hand-pick your favourites from all seven signature fragrances." },
  { n: "03", title: "Find your signature", text: "Wear a different attar each day and discover the one that feels like you." },
];

export default async function ComboCollectionPage() {
  const combos = await getCombos();
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Combo Collection" }]}
        eyebrow="Combo Collection"
        title={
          <>
            Curated sets, <em>made to explore.</em>
          </>
        }
        description="Perfect for first-time buyers, building a fragrance wardrobe, or gifting someone special."
      />

      <section className="container-x section-y !pt-12 md:!pt-16">
        <ol className="reveal-stagger grid gap-8 border-b border-line pb-12 md:grid-cols-3 md:gap-10 md:pb-16">
          {steps.map((s) => (
            <li key={s.n}>
              <p className="font-serif text-4xl text-gold">{s.n}</p>
              <p className="mt-3 font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="reveal-stagger mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 md:mt-16 lg:grid-cols-3">
          {combos.map((combo) => (
            <ComboCard key={combo.slug} combo={combo} featured />
          ))}
        </div>
      </section>
    </>
  );
}

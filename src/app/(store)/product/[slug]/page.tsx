import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { comboSummary, ComboCard } from "@/components/combo-card";
import { CheckIcon, DropIcon, HourglassIcon, LeafIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/page-header";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { site } from "@/data/site";
import { getAllSlugs, getAttarBySlug, getAttars, getComboBySlug, getCombos } from "@/lib/catalog";
import type { Attar, Combo } from "@/data/types";
import { Gallery } from "./gallery";
import { AttarPurchase, ComboPurchase } from "./purchase";

export async function generateStaticParams() {
  return (await getAllSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const attar = await getAttarBySlug(slug);
  const combo = attar ? null : await getComboBySlug(slug);
  if (attar) {
    return {
      title: `${attar.name} Attar | ${attar.character}`,
      description: attar.about.slice(0, 155),
      openGraph: { images: [attar.image] },
      alternates: { canonical: `/product/${slug}` },
    };
  }
  if (combo) {
    return {
      title: `${combo.name} | ${comboSummary(combo)}`,
      description: combo.about.slice(0, 155),
      openGraph: { images: [combo.image] },
      alternates: { canonical: `/product/${slug}` },
    };
  }
  return {};
}

const promises = [
  { Icon: HourglassIcon, label: "Long-lasting" },
  { Icon: DropIcon, label: "Alcohol-free" },
  { Icon: LeafIcon, label: "Skin-friendly" },
];

function Promises() {
  return (
    <ul className="mt-8 grid grid-cols-3 border-y border-line">
      {promises.map(({ Icon, label }, i) => (
        <li
          key={label}
          className={`flex flex-col items-center gap-2 py-5 text-center text-[11px] uppercase tracking-[0.04em] sm:flex-row sm:justify-center sm:text-[12px] ${
            i > 0 ? "border-l border-line" : ""
          }`}
        >
          <Icon className="size-5 text-gold" />
          {label}
        </li>
      ))}
    </ul>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-ink-soft">
          <CheckIcon className="mt-1 size-4 shrink-0 text-gold" strokeWidth={1.8} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Details({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between py-5 text-[13px] font-medium uppercase tracking-[0.04em] [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden className="text-xl font-light transition-transform duration-300 group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

function productJsonLd(name: string, image: string, description: string, low: number, high: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    image: `${site.url}${image}`,
    description,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: low,
      highPrice: high,
      availability: "https://schema.org/InStock",
    },
  };
}

async function AttarDetail({ attar }: { attar: Attar }) {
  const attars = await getAttars();
  const tiers = [
    { label: "Top Notes", hint: "First impression", notes: attar.notes.top },
    { label: "Heart Notes", hint: "The character", notes: attar.notes.heart },
    { label: "Base Notes", hint: "What lingers", notes: attar.notes.base },
  ];
  const related = attars.filter((a) => a.slug !== attar.slug).slice(0, 4);
  const families = attar.categories.filter((c) => !["Best Seller", "Signature"].includes(c));
  const jsonLd = productJsonLd(attar.name, attar.image, attar.about, attar.sizes[0].price, attar.sizes.at(-1)!.price);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container-x pb-16 pt-6 md:pb-24 md:pt-8">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/attar", label: "Attar" }, { label: attar.name }]} />
        <div className="mt-6 grid gap-10 md:mt-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <Gallery images={attar.gallery} alt={`${attar.name} attar by DN Essentia`} />

          <div className="lg:py-4">
            <p className="eyebrow">{families.join(" · ")}</p>
            <h1 className="mt-3 text-[3.25rem] leading-none sm:text-6xl lg:text-7xl">{attar.name}</h1>
            <p className="mt-3 text-[13px] uppercase tracking-[0.04em] text-muted">{attar.character}</p>
            <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">{attar.about}</p>
            <div className="mt-8">
              <AttarPurchase attar={attar} />
            </div>
            <Promises />
            <div className="mt-2">
              <Details title="Best For" open>
                <p className="text-ink-soft">{attar.bestFor}</p>
              </Details>
              <Details title="How to Use">
                <p className="text-ink-soft">
                  Apply a small amount to your pulse points: wrists, neck and behind the ears. For enhanced performance,
                  apply on moisturised skin and let it settle naturally.
                </p>
              </Details>
              <Details title="Shipping & Returns">
                <p className="text-ink-soft">
                  Free shipping on orders above ₹{site.freeShippingThreshold}. Delivered in 3–7 business days. Damaged or
                  wrong items are replaced. Just share your unboxing video within 3 days of delivery.
                </p>
              </Details>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-espresso text-ivory">
        <div className="container-x section-y">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="eyebrow !text-gold-soft">The Fragrance Pyramid</p>
            <h2 className="mt-4 text-[2.5rem] sm:text-5xl lg:text-6xl">
              How <em>{attar.name}</em> unfolds
            </h2>
          </div>
          <div className="reveal-stagger mt-12 grid gap-px overflow-hidden bg-white/10 md:mt-16 md:grid-cols-3">
            {tiers.map((tier, i) => (
              <div key={tier.label} className="bg-espresso p-8 text-center lg:p-12">
                <p className="font-serif text-5xl italic text-gold-soft/60">0{i + 1}</p>
                <p className="mt-4 text-[12px] uppercase tracking-[0.04em]">{tier.label}</p>
                <p className="mt-1 text-[13px] text-ivory/50">{tier.hint}</p>
                <p className="mt-6 font-serif text-2xl leading-snug sm:text-[1.75rem]">{tier.notes.join(" · ")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-x">
          <SectionHeading align="left" eyebrow="You may also like" title={<>More from the <em>collection</em></>} />
          <div className="reveal-stagger mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((a) => (
              <ProductCard key={a.slug} attar={a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

async function ComboDetail({ combo }: { combo: Combo }) {
  const [attars, combos] = await Promise.all([getAttars(), getCombos()]);
  const related = combos.filter((c) => c.slug !== combo.slug).slice(0, 3);
  const jsonLd = productJsonLd(combo.name, combo.image, combo.about, combo.price, combo.price);
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="container-x pb-16 pt-6 md:pb-24 md:pt-8">
        <Breadcrumbs
          items={[{ href: "/", label: "Home" }, { href: "/combo-collection", label: "Combo Collection" }, { label: combo.name }]}
        />
        <div className="mt-6 grid gap-10 md:mt-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <Gallery images={[combo.image]} alt={`${combo.name} attar gift box by DN Essentia`} ratio="aspect-[7/5]" />

          <div className="lg:py-4">
            <p className="eyebrow">{comboSummary(combo)}</p>
            <h1 className="mt-3 text-[3.25rem] leading-none sm:text-6xl lg:text-7xl">{combo.name}</h1>
            <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">{combo.about}</p>
            <div className="mt-8">
              <ComboPurchase combo={combo} attars={attars} />
            </div>
            <Promises />
            <div className="mt-2">
              <Details title="What's in the box" open>
                <CheckList items={combo.includes} />
              </Details>
              <Details title="Perfect For">
                <CheckList items={combo.perfectFor} />
              </Details>
              <Details title="How to Use">
                <p className="text-ink-soft">{combo.howToUse}</p>
              </Details>
              <Details title="Why DN Essentia">
                <CheckList items={combo.whyChoose} />
              </Details>
            </div>
          </div>
        </div>
      </section>

      <section className="section-y bg-cream">
        <div className="container-x">
          <SectionHeading align="left" eyebrow="Explore more" title={<>Other <em>collections</em></>} />
          <div className="reveal-stagger mt-12 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {related.map((c) => (
              <ComboCard key={c.slug} combo={c} featured />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const attar = await getAttarBySlug(slug);
  if (attar) return <AttarDetail attar={attar} />;
  const combo = await getComboBySlug(slug);
  if (combo) return <ComboDetail combo={combo} />;
  notFound();
}

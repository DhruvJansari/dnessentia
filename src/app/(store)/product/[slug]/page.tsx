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
import { Stars } from "@/components/stars";
import { WishButton } from "@/components/wish-button";
import type { Rating } from "@/data/types";
import { getProductReviews } from "@/lib/catalog";
import { Gallery } from "./gallery";
import { PincodeCheck, ProductViewTracker, RecentlyViewed } from "./product-extras";
import { ProductReviews } from "./reviews";
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

type JsonLdInput = {
  productId: number;
  slug: string;
  name: string;
  image: string;
  description: string;
  low: number;
  high: number;
  inStock: boolean;
  rating: Rating | null;
  crumbs: { name: string; path: string }[];
};

/** Product + breadcrumb structured data, with ratings and recent reviews for Google rich results. */
async function structuredData(p: JsonLdInput) {
  const reviews = p.rating ? (await getProductReviews(p.productId)).slice(0, 5) : [];
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    image: `${site.url}${p.image}`,
    description: p.description,
    sku: p.slug,
    brand: { "@type": "Brand", name: site.name },
    url: `${site.url}/product/${p.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: p.low,
      highPrice: p.high,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(p.rating
      ? {
          aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.average, reviewCount: p.rating.count, bestRating: 5 },
          review: reviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.name },
            datePublished: r.createdAt.slice(0, 10),
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            reviewBody: r.body,
          })),
        }
      : {}),
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: p.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${site.url}${c.path}` })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
    </>
  );
}

function RatingLink({ rating }: { rating: Rating | null }) {
  if (!rating) return null;
  return (
    <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink">
      <Stars value={rating.average} /> {rating.average.toFixed(1)} · {rating.count} review{rating.count === 1 ? "" : "s"}
    </a>
  );
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
  const jsonLd = await structuredData({
    productId: attar.id,
    slug: attar.slug,
    name: attar.name,
    image: attar.image,
    description: attar.about,
    low: attar.sizes[0].price,
    high: attar.sizes.at(-1)!.price,
    inStock: attar.sizes.some((s) => s.stock > 0),
    rating: attar.rating,
    crumbs: [
      { name: "Home", path: "/" },
      { name: "Attar", path: "/attar" },
      { name: attar.name, path: `/product/${attar.slug}` },
    ],
  });

  return (
    <>
      {jsonLd}
      <ProductViewTracker slug={attar.slug} />
      <section className="container-x pb-16 pt-6 md:pb-24 md:pt-8">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/attar", label: "Attar" }, { label: attar.name }]} />
        <div className="mt-6 grid gap-10 md:mt-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <Gallery images={attar.gallery} alt={`${attar.name} attar by DN Essentia`} />

          <div className="lg:py-4">
            <p className="eyebrow">{families.join(" · ")}</p>
            <h1 className="mt-3 text-[3.25rem] leading-none sm:text-6xl lg:text-7xl">{attar.name}</h1>
            <p className="mt-3 text-[13px] uppercase tracking-[0.04em] text-muted">{attar.character}</p>
            <RatingLink rating={attar.rating} />
            <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">{attar.about}</p>
            <div className="mt-8">
              <AttarPurchase attar={attar} />
            </div>
            <WishButton slug={attar.slug} withLabel className="mt-5 text-ink-soft hover:text-ink" />
            <PincodeCheck />
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
              <Details title="Shipping, Cancellation & Replacement">
                <p className="text-ink-soft">
                  Free shipping on orders above ₹{site.freeShippingThreshold}. Delivered in 3-7 business days. Cancel within 12 hours of
                  ordering (50% charge on prepaid orders). No returns; damaged, leaked or wrong items are replaced if you share your
                  unboxing video within 3 days of delivery.
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

      <ProductReviews productId={attar.id} productName={attar.name} slug={attar.slug} rating={attar.rating} />

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
      <RecentlyViewed currentSlug={attar.slug} />
    </>
  );
}

async function ComboDetail({ combo }: { combo: Combo }) {
  const [attars, combos] = await Promise.all([getAttars(), getCombos()]);
  const related = combos.filter((c) => c.slug !== combo.slug).slice(0, 3);
  const jsonLd = await structuredData({
    productId: combo.id,
    slug: combo.slug,
    name: combo.name,
    image: combo.image,
    description: combo.about,
    low: combo.price,
    high: combo.price,
    inStock: combo.stock > 0,
    rating: combo.rating,
    crumbs: [
      { name: "Home", path: "/" },
      { name: "Combo Collection", path: "/combo-collection" },
      { name: combo.name, path: `/product/${combo.slug}` },
    ],
  });
  return (
    <>
      {jsonLd}
      <ProductViewTracker slug={combo.slug} />
      <section className="container-x pb-16 pt-6 md:pb-24 md:pt-8">
        <Breadcrumbs
          items={[{ href: "/", label: "Home" }, { href: "/combo-collection", label: "Combo Collection" }, { label: combo.name }]}
        />
        <div className="mt-6 grid gap-10 md:mt-10 lg:grid-cols-2 lg:gap-16 xl:gap-24">
          <Gallery images={[combo.image]} alt={`${combo.name} attar gift box by DN Essentia`} ratio="aspect-[7/5]" />

          <div className="lg:py-4">
            <p className="eyebrow">{comboSummary(combo)}</p>
            <h1 className="mt-3 text-[3.25rem] leading-none sm:text-6xl lg:text-7xl">{combo.name}</h1>
            <RatingLink rating={combo.rating} />
            <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">{combo.about}</p>
            <div className="mt-8">
              <ComboPurchase combo={combo} attars={attars} />
            </div>
            <WishButton slug={combo.slug} withLabel className="mt-5 text-ink-soft hover:text-ink" />
            <PincodeCheck />
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

      <ProductReviews productId={combo.id} productName={combo.name} slug={combo.slug} rating={combo.rating} />

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
      <RecentlyViewed currentSlug={combo.slug} />
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

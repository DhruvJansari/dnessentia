import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { brandPillars } from "@/components/home/why-us";
import { ArrowIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "DN Essentia was created to simplify fragrance. From 100+ fragrances, only seven were chosen: premium, long-lasting, alcohol-free attars.",
};

const principles = [
  {
    title: "Refinement, not excess",
    text: "We believe true luxury lies in refinement. Every fragrance in our collection has a purpose.",
  },
  {
    title: "Only what meets our standard",
    text: "From hundreds of options, we select only what meets our standard. Nothing more, nothing less.",
  },
  {
    title: "Performance as a foundation",
    text: "Long-lasting performance is not a feature. It's the foundation of every bottle we make.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-cream">
        <div className="container-x pb-14 pt-8 md:pb-20 md:pt-10">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About" }]} />
          <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-[1.1fr_1fr] lg:items-end lg:gap-16">
            <div>
              <p className="eyebrow">Our Story</p>
              <h1 className="mt-4 text-[3rem] leading-[0.98] sm:text-6xl lg:text-[5.25rem]">
                Crafted with purpose. <em>Designed to last.</em>
              </h1>
            </div>
            <p className="max-w-lg text-lg leading-relaxed text-ink-soft">
              DN Essentia was created with a clear purpose: to simplify fragrance. In a world of endless choices, we
              set out to find what truly matters.
            </p>
          </div>
        </div>
      </section>

      <div className="container-x -mt-px">
        <div className="reveal-image relative aspect-[16/10] overflow-hidden sm:aspect-[16/8] lg:aspect-[16/7]">
          <Image
            src="/images/brand/hero.png"
            alt="The DN Essentia attar collection"
            fill
            preload
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="object-cover object-[80%_50%]"
          />
        </div>
      </div>

      <section className="section-y">
        <div className="container-x grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="font-serif text-[8rem] leading-none text-gold sm:text-[10rem]">7</p>
            <p className="-mt-2 text-[12px] uppercase tracking-[0.04em] text-muted">chosen from 100+ fragrances</p>
          </div>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              After exploring hundreds of fragrances, only a select few were chosen, the ones that deliver real quality,
              performance and identity.
            </p>
            <p>
              Each scent is carefully curated to save your time, avoid unnecessary expense, and leave a lasting
              impression. Fragrance is more than scent. It is identity. Every bottle is created to reflect confidence,
              presence and individuality.
            </p>
          </div>
        </div>
      </section>

      <section className="section-y bg-sand">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">What we stand for</p>
            <h2 className="mt-4 text-[2.5rem] sm:text-5xl lg:text-[3.75rem]">
              From hundreds, <em>only the finest.</em>
            </h2>
          </div>
          <div className="reveal-stagger mt-12 grid gap-px bg-line md:mt-16 md:grid-cols-3">
            {principles.map((p, i) => (
              <div key={p.title} className="bg-sand p-8 lg:p-10">
                <p className="font-serif text-4xl text-gold">0{i + 1}</p>
                <h3 className="mt-6 text-3xl">{p.title}</h3>
                <p className="mt-3 text-ink-soft">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-x">
          <ul className="reveal-stagger grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {brandPillars.map(({ Icon, title, text }) => (
              <li key={title}>
                <Icon className="size-9 text-gold" />
                <p className="mt-5 font-serif text-2xl">{title}</p>
                <p className="mt-2 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>

          <div className="mt-20 flex flex-col items-center text-center">
            <h2 className="max-w-xl text-4xl sm:text-5xl">
              Find the fragrance that feels like <em>you.</em>
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/attar" className="btn btn-dark">
                Shop Attars <ArrowIcon className="size-4" />
              </Link>
              <Link href="/combo-collection" className="btn btn-outline">
                Try a Combo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

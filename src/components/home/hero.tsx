import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../icons";

const stats = [
  { value: "7", label: "Signature scents" },
  { value: "100%", label: "Pure oil" },
  { value: "0%", label: "Alcohol" },
];

const heroSrc = "/images/brand/hero.png";
const heroAlt = "Seven DN Essentia attar bottles on a sandstone plinth";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#d9bf9f] lg:flex lg:h-[min(56.25vw,calc(100svh-7rem))] lg:min-h-[600px] lg:items-center">
      {/* Below lg: a blurred copy of the photo fills the area behind the copy so text and bottles read as one scene. */}
      <div aria-hidden className="absolute inset-0 -z-20 lg:hidden">
        <Image src={heroSrc} alt="" fill sizes="50vw" className="scale-125 object-cover object-left-top blur-2xl" />
        <div className="absolute inset-0 bg-[#f1e2cd]/45" />
      </div>

      {/* lg+: the photo is the full-bleed background and the copy sits on its open left side. */}
      <div className="absolute inset-0 -z-10 hidden lg:block">
        <Image src={heroSrc} alt={heroAlt} fill preload quality={90} sizes="100vw" className="animate-hero-zoom object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#ecdcc4]/75 via-[#ecdcc4]/15 to-transparent" />
      </div>

      <div className="container-x relative pt-12 sm:pt-16 lg:py-0">
        <div className="stagger-in max-w-[34rem] lg:max-w-[28rem] xl:max-w-[31rem]">
          <p className="eyebrow !text-ink">Premium Alcohol-Free Attars</p>
          <h1 className="mt-4 text-[3.25rem] leading-[0.95] sm:text-[4.25rem] lg:text-[4.5rem] xl:text-[5.5rem]">
            Luxury fragrance, <em className="text-[#8a6326]">crafted to last.</em>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ink-soft sm:text-base">
            Made from 100% concentrated fragrance oils. Pure essence, lasting impression.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/attar" className="btn btn-dark">
              Shop Attars <ArrowIcon className="size-4" />
            </Link>
            <Link href="/combo-collection" className="btn btn-outline !border-ink/40">
              Explore Combos
            </Link>
          </div>
          <dl className="mt-9 hidden max-w-sm grid-cols-3 gap-x-6 border-t border-ink/15 pt-6 lg:grid">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="sr-only">{s.label}</dt>
                <dd className="font-serif text-4xl leading-none">{s.value}</dd>
                <dd className="mt-1.5 text-[12px] leading-snug text-ink-soft">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Below lg: the sharp photo fades in from the blurred backdrop under the copy. */}
      <div className="relative -mt-6 aspect-[4/3] [mask-image:linear-gradient(to_bottom,transparent,black_28%)] sm:-mt-10 sm:aspect-[16/9] lg:hidden">
        <Image
          src={heroSrc}
          alt={heroAlt}
          fill
          preload
          quality={90}
          sizes="100vw"
          className="animate-hero-zoom object-cover object-[92%_50%] sm:object-center"
        />
      </div>
    </section>
  );
}

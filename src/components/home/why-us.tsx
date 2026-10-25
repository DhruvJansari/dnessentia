import Image from "next/image";
import Link from "next/link";
import { getAttarBySlug } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { ArrowIcon, DiamondIcon, DropIcon, HourglassIcon, LeafIcon } from "../icons";

export const brandPillars = [
  { Icon: HourglassIcon, title: "Long Lasting", text: "Pure concentration that stays with you." },
  { Icon: DropIcon, title: "Alcohol Free", text: "No alcohol, just pure perfume oil." },
  { Icon: LeafIcon, title: "Skin Friendly", text: "Skin friendly & safe for everyday use." },
  { Icon: DiamondIcon, title: "Premium Ingredients", text: "Finest quality oils from around the world." },
];

function Ornament({ flip = false }: { flip?: boolean }) {
  return (
    <Image
      src="/images/brand/ornament.png"
      alt=""
      width={1024}
      height={317}
      sizes="220px"
      className={`h-auto w-40 opacity-45 brightness-0 sm:w-48 lg:w-52 ${flip ? "rotate-180" : ""}`}
    />
  );
}

/** "Why DN Essentia" and the Royal Oud feature share one section, as on the original site. */
export async function WhyUs() {
  const oud = await getAttarBySlug("royal-oud");
  return (
    <section className="jaali jaali-sides section-y bg-sand">
      <div className="container-x">
        {/* Row 1: image · story · pillars */}
        <div className="grid items-center gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          <div className="reveal-image group relative aspect-[16/10] overflow-hidden shadow-[0_24px_50px_-28px_rgba(28,23,18,0.55)] md:col-span-2 lg:col-span-5">
            <Image
              src="/images/brand/craft.png"
              alt="The seven DN Essentia attars with oud wood and amber resin"
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover transition-transform duration-[1.6s] ease-(--ease-luxe) group-hover:scale-[1.05]"
            />
          </div>

          <div className="reveal lg:col-span-4">
            <p className="eyebrow">Why DN Essentia?</p>
            <h2 className="mt-3 text-[2.5rem] sm:text-5xl lg:text-[3.25rem]">
              Crafted with passion. <em>Made to last.</em>
            </h2>
            <p className="mt-5 text-ink-soft">
              At DN Essentia, we believe fragrance is more than a scent. It&apos;s an emotion. Our attars are crafted from
              the finest ingredients to deliver a luxurious, long-lasting experience that stays with you.
            </p>
            <Link href="/about" className="btn btn-outline mt-8">
              Our Story <ArrowIcon className="size-4" />
            </Link>
          </div>

          <ul className="reveal-stagger grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:col-span-3">
            {brandPillars.map(({ Icon, title, text }) => (
              <li
                key={title}
                className="group flex cursor-default items-center gap-4 rounded-full bg-ivory py-3 pl-3 pr-6 shadow-[0_10px_24px_-14px_rgba(28,23,18,0.35)] transition-shadow duration-500 hover:shadow-[0_18px_34px_-14px_rgba(28,23,18,0.45)]"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sand text-gold transition-[background-color,color,rotate] duration-500 ease-(--ease-luxe) group-hover:rotate-[-12deg] group-hover:bg-gold group-hover:text-ivory">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[15px] font-medium leading-tight">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Row 2: Oud wordmark · feature image · signature copy (hidden if Royal Oud is unpublished) */}
        {oud && (
          <div className="mt-16 grid items-center gap-10 md:mt-20 md:grid-cols-2 lg:mt-24 lg:grid-cols-12 lg:gap-12">
            <div className="reveal flex flex-col items-center gap-3 md:col-span-2 lg:col-span-3 lg:gap-5" aria-hidden>
              <Ornament />
              <p className="font-serif text-[5.5rem] leading-none text-ink-soft sm:text-[7rem] lg:text-[8rem]">Oud</p>
              <Ornament flip />
            </div>

            <div className="reveal-image group relative aspect-[3/2] overflow-hidden shadow-[0_24px_50px_-28px_rgba(28,23,18,0.55)] lg:col-span-5">
              <Image
                src="/images/brand/royal-oud-feature.png"
                alt="Royal Oud attar beside oud wood chips and a brass incense burner"
                fill
                sizes="(min-width: 1024px) 40vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1.6s] ease-(--ease-luxe) group-hover:scale-[1.05]"
              />
            </div>

            <div className="reveal lg:col-span-4">
              <p className="eyebrow">Signature Fragrance</p>
              <h2 className="mt-3 text-6xl lg:text-7xl">{oud.name}</h2>
              <p className="mt-5 text-ink-soft">
                Royal Oud is a bold and luxurious fragrance crafted with rich oud, warm spices, amber, and soft musk. Deep,
                woody, and long-lasting, it delivers a royal and sophisticated scent perfect for every occasion.
              </p>
              <p className="mt-4 text-sm text-muted">
                Top: {oud.notes.top.join(", ")}
                <br />
                Base: {oud.notes.base.join(", ")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link href={`/product/${oud.slug}`} className="btn btn-outline">
                  Discover More <ArrowIcon className="size-4" />
                </Link>
                <p className="text-sm text-muted">
                  From <span className="font-medium text-ink">{formatPrice(oud.sizes[0].price)}</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

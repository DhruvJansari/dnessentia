import Image from "next/image";
import Link from "next/link";
import type { Attar } from "@/data/types";
import { formatPrice } from "@/lib/format";
import { ArrowIcon } from "./icons";
import { QuickAdd } from "./quick-add";
import { Stars } from "./stars";
import { WishButton } from "./wish-button";

export function ProductCard({ attar, priority = false }: { attar: Attar; priority?: boolean }) {
  const from = attar.sizes[0];
  const isBestSeller = attar.categories.includes("Best Seller");
  return (
    <article className="group relative flex flex-col">
      <Link
        href={`/product/${attar.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-white"
        aria-label={attar.name}
      >
        <Image
          src={attar.image}
          alt={`${attar.name} attar bottle`}
          fill
          preload={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain transition-transform duration-[1.2s] ease-(--ease-luxe) group-hover:scale-[1.06]"
        />
        <Image
          src={attar.gallery[1]}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        />
        {isBestSeller && (
          <span className="absolute left-3 top-3 bg-ivory/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.04em] text-ink backdrop-blur-sm">
            Best Seller
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 items-center justify-center gap-2 bg-ink/90 py-2.5 text-[12px] font-medium uppercase tracking-[0.05em] text-ivory opacity-0 backdrop-blur-sm transition duration-500 ease-(--ease-luxe) group-hover:translate-y-0 group-hover:opacity-100 md:flex">
          Discover <ArrowIcon className="size-3.5" />
        </span>
      </Link>
        <WishButton slug={attar.slug} className="absolute right-3 top-3 z-10 size-9 rounded-full bg-ivory/90 backdrop-blur-sm" />
      <div className="flex flex-1 flex-col pt-4 sm:pt-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[1.375rem] leading-tight sm:text-[1.625rem]">
            <Link href={`/product/${attar.slug}`} className="hover:text-gold">
              {attar.name}
            </Link>
          </h3>
          <QuickAdd attar={attar} />
        </div>
        <p className="mt-1 text-[12px] tracking-wide text-muted sm:text-[13px]">{attar.character}</p>
        {attar.rating && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted">
            <Stars value={attar.rating.average} />
            {attar.rating.average.toFixed(1)} ({attar.rating.count})
          </p>
        )}
        <p className="mt-2 text-sm">
          <span className="text-muted">From </span>
          <span className="font-medium">{formatPrice(from.price)}</span>
        </p>
      </div>
    </article>
  );
}

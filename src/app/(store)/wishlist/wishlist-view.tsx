"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { ArrowIcon, CloseIcon } from "@/components/icons";
import { Stars } from "@/components/stars";
import { useStore } from "@/components/store-context";
import { formatPrice } from "@/lib/format";

export function WishlistView() {
  const { wishlist, products, toggleWish } = useStore();
  const { add } = useCart();
  const saved = wishlist.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="font-serif text-4xl">Nothing saved yet</p>
        <p className="mt-2 max-w-sm text-muted">Tap the heart on any fragrance to keep it here.</p>
        <Link href="/attar" className="btn btn-dark mt-8">
          Explore attars <ArrowIcon className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <ul className="reveal-stagger grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {saved.map((p) => (
        <li key={p.id} className="group relative flex flex-col">
          <Link href={`/product/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white">
            <Image src={p.image} alt={p.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-contain transition-transform duration-[1.2s] ease-(--ease-luxe) group-hover:scale-[1.05]" />
          </Link>
          <button
            type="button"
            onClick={() => toggleWish(p)}
            aria-label={`Remove ${p.name} from wishlist`}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ivory/90 hover:text-red-600"
          >
            <CloseIcon className="size-4" />
          </button>
          <div className="flex flex-1 flex-col pt-4">
            <Link href={`/product/${p.slug}`} className="font-serif text-2xl leading-tight hover:text-gold">
              {p.name}
            </Link>
            <p className="mt-1 text-[13px] text-muted">{p.subtitle}</p>
            {p.rating && (
              <p className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                <Stars value={p.rating.average} /> ({p.rating.count})
              </p>
            )}
            <p className="mt-2 text-sm">From {formatPrice(p.priceFrom)}</p>
            {p.quickVariant ? (
              <button
                type="button"
                onClick={() => add({ variantId: p.quickVariant!.id, slug: p.slug, name: p.name, image: p.image, variant: p.quickVariant!.label, price: p.quickVariant!.price })}
                className="btn btn-outline mt-4 h-10 px-4"
              >
                Add {p.quickVariant.label} to bag
              </button>
            ) : (
              <Link href={`/product/${p.slug}`} className="btn btn-outline mt-4 h-10 px-4">
                Choose attars
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

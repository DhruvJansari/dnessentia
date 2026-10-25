import Image from "next/image";
import Link from "next/link";
import type { Combo } from "@/data/types";
import { discountPercent, formatPrice } from "@/lib/format";
import { ArrowIcon } from "./icons";

export function comboSummary(combo: Combo) {
  return combo.pick === 7 ? `All 7 attars · ${combo.sizeMl} ml each` : `Choose any ${combo.pick} · ${combo.sizeMl} ml each`;
}

export function ComboCard({ combo, featured = false }: { combo: Combo; featured?: boolean }) {
  const off = discountPercent(combo.price, combo.regularPrice);
  return (
    <Link
      href={`/product/${combo.slug}`}
      className="group flex h-full flex-col overflow-hidden border border-line bg-white transition-shadow duration-500 hover:shadow-[0_30px_60px_-35px_rgba(28,23,18,0.35)]"
    >
      <div className={`relative overflow-hidden ${featured ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <Image
          src={combo.image}
          alt={`${combo.name}, DN Essentia attar gift box`}
          fill
          sizes={featured ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 50vw"}
          className="object-cover transition-transform duration-[1.2s] ease-(--ease-luxe) group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.04em] text-ivory sm:left-4 sm:top-4">
          Save {off}%
        </span>
      </div>
      <div className={`flex flex-1 flex-col border-t border-line ${featured ? "p-5 sm:p-7" : "p-4 sm:p-5"}`}>
        <p className="text-[11px] uppercase tracking-[0.04em] text-gold sm:text-[12px]">{comboSummary(combo)}</p>
        <div className="mt-2 flex flex-1 items-end justify-between gap-3">
          <h3 className={featured ? "text-3xl sm:text-[2.5rem]" : "text-[1.5rem] sm:text-[1.75rem]"}>{combo.name}</h3>
          <ArrowIcon className="mb-1.5 hidden size-5 shrink-0 transition-transform duration-500 group-hover:translate-x-1 sm:block" />
        </div>
        <p className="mt-2 text-sm">
          <span className="font-medium">{formatPrice(combo.price)}</span>
          <span className="ml-2 text-muted line-through">{formatPrice(combo.regularPrice)}</span>
        </p>
      </div>
    </Link>
  );
}

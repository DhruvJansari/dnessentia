"use client";

import type { Attar } from "@/data/types";
import { useCart } from "./cart/cart-context";
import { CheckIcon, PlusIcon } from "./icons";
import { useFlash } from "./use-flash";

/** Adds the smallest in-stock size straight from a product card. */
export function QuickAdd({ attar }: { attar: Attar }) {
  const { add } = useCart();
  const [added, flash] = useFlash();
  const size = attar.sizes.find((s) => s.stock > 0);
  if (!size) {
    return <span className="shrink-0 pt-2 text-[11px] uppercase tracking-[0.04em] text-muted">Sold out</span>;
  }
  return (
    <button
      type="button"
      onClick={() => {
        add({
          variantId: size.id,
          slug: attar.slug,
          name: attar.name,
          image: attar.image,
          variant: size.label,
          price: size.price,
        });
        flash();
      }}
      aria-label={`Add ${attar.name} ${size.label} to bag`}
      title={`Add ${size.label} to bag`}
      className={`group/add relative grid size-9 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color,scale] duration-300 active:scale-90 ${
        added ? "border-gold bg-gold text-white" : "border-line hover:border-ink hover:bg-ink hover:text-ivory"
      }`}
    >
      {added ? (
        <CheckIcon key="check" className="size-4 animate-pop" strokeWidth={2} />
      ) : (
        <PlusIcon className="size-4 transition-transform duration-500 ease-(--ease-luxe) group-hover/add:rotate-90" />
      )}
    </button>
  );
}

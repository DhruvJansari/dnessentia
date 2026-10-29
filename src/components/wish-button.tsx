"use client";

import { HeartIcon } from "./icons";
import { useStore } from "./store-context";

/** Heart toggle. Works for guests (saved in the browser) and signed-in customers (saved to the account). */
export function WishButton({ slug, className = "", withLabel = false }: { slug: string; className?: string; withLabel?: boolean }) {
  const { bySlug, isWished, toggleWish } = useStore();
  const product = bySlug.get(slug);
  if (!product) return null;
  const on = isWished(product.id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWish(product);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`group/wish inline-flex items-center justify-center gap-2 transition-colors ${className}`}
    >
      <HeartIcon
        filled={on}
        className={`size-5 transition-transform duration-300 group-active/wish:scale-75 ${on ? "animate-pop text-red-600" : "text-ink-soft group-hover/wish:text-red-600"}`}
      />
      {withLabel && <span className="text-[13px]">{on ? "Saved to wishlist" : "Add to wishlist"}</span>}
    </button>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { formatPrice, whatsappLink } from "@/lib/format";
import { ArrowIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "../icons";
import { useStore } from "../store-context";
import { useCart, type CartItem } from "./cart-context";

function orderMessage(items: CartItem[], subtotal: number) {
  const lines = items.map((i) => {
    const picks = i.selections?.length ? `\n   Attars: ${i.selections.join(", ")}` : "";
    return `• ${i.name} (${i.variant}) × ${i.qty}: ${formatPrice(i.price * i.qty)}${picks}`;
  });
  return `Hello DN Essentia, I'd like to place an order:\n\n${lines.join("\n")}\n\nSubtotal: ${formatPrice(subtotal)}`;
}

export function FreeShippingMeter({ subtotal }: { subtotal: number }) {
  const remaining = site.freeShippingThreshold - subtotal;
  const progress = Math.min(100, (subtotal / site.freeShippingThreshold) * 100);
  return (
    <div>
      <p className="text-[13px] text-muted">
        {remaining > 0 ? (
          <>
            Add <span className="font-medium text-ink">{formatPrice(remaining)}</span> more for free shipping
          </>
        ) : (
          <span className="font-medium text-ink">You&apos;ve unlocked free shipping</span>
        )}
      </p>
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-sand-deep">
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-700 ease-(--ease-luxe)"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function CartLines({ onNavigate }: { onNavigate?: () => void }) {
  const { items, setQty, remove } = useCart();
  return (
    <ul className="divide-y divide-line">
      {items.map((item) => (
        <li key={item.key} className="flex gap-4 py-5">
          <Link
            href={`/product/${item.slug}`}
            onClick={onNavigate}
            className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden bg-white sm:w-24"
          >
            <Image src={item.image} alt={item.name} fill sizes="96px" className="object-contain" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/product/${item.slug}`}
                  onClick={onNavigate}
                  className="font-serif text-xl leading-tight hover:text-gold"
                >
                  {item.name}
                </Link>
                <p className="mt-0.5 text-[13px] text-muted">{item.variant}</p>
                {item.selections?.length ? (
                  <p className="mt-1 text-[12px] leading-snug text-muted">{item.selections.join(" · ")}</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm font-medium">{formatPrice(item.price * item.qty)}</p>
            </div>
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="flex h-9 items-center border border-line">
                <button
                  type="button"
                  aria-label={`Decrease ${item.name} quantity`}
                  onClick={() => setQty(item.key, item.qty - 1)}
                  className="grid h-full w-9 place-items-center hover:bg-sand"
                >
                  <MinusIcon className="size-3.5" />
                </button>
                <span className="w-8 text-center text-sm tabular-nums">{item.qty}</span>
                <button
                  type="button"
                  aria-label={`Increase ${item.name} quantity`}
                  onClick={() => setQty(item.key, item.qty + 1)}
                  className="grid h-full w-9 place-items-center hover:bg-sand"
                >
                  <PlusIcon className="size-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(item.key)}
                className="link-underline text-[12px] uppercase tracking-[0.04em] text-muted hover:text-ink"
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartSummary({ onNavigate }: { onNavigate?: () => void }) {
  const { items, subtotal } = useCart();
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm uppercase tracking-[0.04em] text-muted">Subtotal</span>
        <span className="font-serif text-3xl">{formatPrice(subtotal)}</span>
      </div>
      <p className="text-[13px] text-muted">Shipping and coupons are applied at checkout.</p>
      <Link href="/checkout" onClick={onNavigate} className="btn btn-dark w-full">
        Checkout <ArrowIcon className="size-4" />
      </Link>
      <a
        href={whatsappLink(site.whatsapp, orderMessage(items, subtotal))}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-[13px] text-muted hover:text-ink"
      >
        <WhatsAppIcon className="size-4 text-[#25d366]" />
        Prefer WhatsApp? Order by chat
      </a>
    </div>
  );
}

export function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col items-center py-14 text-center">
      <p className="font-serif text-3xl">Your bag is empty</p>
      <p className="mt-2 max-w-xs text-sm text-muted">Discover long-lasting, alcohol-free attars crafted to be remembered.</p>
      <Link href="/attar" onClick={onNavigate} className="btn btn-dark mt-7">
        Shop Attars
      </Link>
    </div>
  );
}

/** "Complete the ritual" upsell: one-tap 1 ml samples of attars that aren't in the bag yet. */
export function CartSuggestions({ limit = 3 }: { limit?: number }) {
  const { items, add } = useCart();
  const { products } = useStore();
  const inBag = new Set(items.map((i) => i.slug));
  const picks = products.filter((p) => p.type === "attar" && p.quickVariant && !inBag.has(p.slug)).slice(0, limit);
  if (picks.length === 0) return null;
  return (
    <div className="border-t border-line py-5">
      <p className="text-[12px] font-medium uppercase tracking-[0.04em] text-muted">Add a sample</p>
      <ul className="mt-3 space-y-3">
        {picks.map((p) => (
          <li key={p.slug} className="flex items-center gap-3">
            <span className="relative size-12 shrink-0 bg-white">
              <Image src={p.image} alt="" fill sizes="48px" className="object-contain" />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block truncate font-medium">{p.name}</span>
              <span className="text-muted">
                {p.quickVariant!.label} · {formatPrice(p.quickVariant!.price)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => add({ variantId: p.quickVariant!.id, slug: p.slug, name: p.name, image: p.image, variant: p.quickVariant!.label, price: p.quickVariant!.price })}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-line transition-colors hover:border-ink hover:bg-ink hover:text-ivory"
              aria-label={`Add ${p.name} ${p.quickVariant!.label}`}
            >
              <PlusIcon className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

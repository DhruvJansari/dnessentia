"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/cart-context";
import { CheckIcon, MinusIcon, PlusIcon, WhatsAppIcon } from "@/components/icons";
import { useFlash } from "@/components/use-flash";
import { site } from "@/data/site";
import type { Attar, Combo } from "@/data/types";
import { discountPercent, formatPrice, whatsappLink } from "@/lib/format";

function QtyStepper({ qty, setQty }: { qty: number; setQty: (n: number) => void }) {
  return (
    <div className="flex h-12 items-center border border-ink/25">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQty(Math.max(1, qty - 1))}
        className="grid h-full w-11 place-items-center hover:bg-sand"
      >
        <MinusIcon className="size-4" />
      </button>
      <span className="w-8 text-center tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => setQty(qty + 1)}
        className="grid h-full w-11 place-items-center hover:bg-sand"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

function AddedLabel() {
  return (
    <span className="flex animate-pop items-center gap-2">
      <CheckIcon className="size-4" strokeWidth={2} /> Added to Bag
    </span>
  );
}

function AskOnWhatsApp({ name }: { name: string }) {
  return (
    <a
      href={whatsappLink(site.whatsapp, `Hi DN Essentia, I have a question about ${name}.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink"
    >
      <WhatsAppIcon className="size-4 text-[#25d366]" />
      Questions? Chat with us on WhatsApp
    </a>
  );
}

export function AttarPurchase({ attar }: { attar: Attar }) {
  const { add } = useCart();
  const [added, flash] = useFlash();
  const firstInStock = Math.max(0, attar.sizes.findIndex((s) => s.stock > 0));
  const [sizeIndex, setSizeIndex] = useState(firstInStock);
  const [qty, setQty] = useState(1);
  const size = attar.sizes[sizeIndex];
  const soldOut = size.stock <= 0;

  return (
    <div>
      <p className="font-serif text-4xl" aria-live="polite">
        {formatPrice(size.price)}
      </p>
      <p className="mt-1 text-[13px] text-muted">Inclusive of all taxes</p>

      <fieldset className="mt-8">
        <legend className="text-[12px] uppercase tracking-[0.04em] text-muted">
          Size: <span className="text-ink">{size.label}</span>
        </legend>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
          {attar.sizes.map((s, i) => (
            <label
              key={s.id}
              className={`relative flex cursor-pointer flex-col items-center border px-2 py-3 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${
                i === sizeIndex ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink/50"
              } ${s.stock <= 0 ? "opacity-50" : ""}`}
            >
              <input
                type="radio"
                name="size"
                value={s.label}
                checked={i === sizeIndex}
                onChange={() => setSizeIndex(i)}
                className="sr-only"
              />
              <span className="font-medium">{s.label}</span>
              <span className={`text-[12px] ${i === sizeIndex ? "text-ivory/70" : "text-muted"}`}>
                {s.stock <= 0 ? "Sold out" : formatPrice(s.price)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex gap-3">
        <QtyStepper qty={qty} setQty={(n) => setQty(Math.min(n, Math.max(1, size.stock)))} />
        <button
          type="button"
          disabled={soldOut}
          onClick={() => {
            add(
              { variantId: size.id, slug: attar.slug, name: attar.name, image: attar.image, variant: size.label, price: size.price },
              qty,
            );
            flash();
          }}
          className="btn btn-dark flex-1 active:scale-[0.98]"
        >
          {added ? <AddedLabel /> : soldOut ? "Sold out" : <>Add to Bag · {formatPrice(size.price * qty)}</>}
        </button>
      </div>
      <AskOnWhatsApp name={attar.name} />
    </div>
  );
}

export function ComboPurchase({ combo, attars }: { combo: Combo; attars: Attar[] }) {
  const { add } = useCart();
  const [added, flash] = useFlash();
  const includesAll = combo.pick >= attars.length;
  const [picked, setPicked] = useState<string[]>(includesAll ? attars.map((a) => a.name) : []);
  const [qty, setQty] = useState(1);
  const remaining = combo.pick - picked.length;

  const toggle = (name: string) => {
    if (includesAll) return;
    setPicked((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : prev.length < combo.pick ? [...prev, name] : prev,
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-serif text-4xl">{formatPrice(combo.price)}</p>
        <p className="text-muted line-through">{formatPrice(combo.regularPrice)}</p>
        <span className="bg-gold px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.04em] text-white">
          Save {discountPercent(combo.price, combo.regularPrice)}%
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted">Inclusive of all taxes</p>

      <fieldset className="mt-8">
        <legend className="flex w-full items-center justify-between text-[12px] uppercase tracking-[0.04em] text-muted">
          <span>{includesAll ? "Included attars" : `Choose ${combo.pick} attars · ${combo.sizeMl} ml each`}</span>
          {!includesAll && (
            <span className={remaining === 0 ? "text-gold" : "text-ink"}>
              {picked.length}/{combo.pick}
            </span>
          )}
        </legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {attars.map((a) => {
            const selected = picked.includes(a.name);
            const disabled = !selected && remaining === 0;
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() => toggle(a.name)}
                aria-pressed={selected}
                disabled={disabled && !includesAll}
                className={`group relative flex items-center gap-2 border p-1.5 pr-3 text-left transition-colors disabled:opacity-40 ${
                  selected ? "border-ink bg-white" : "border-line hover:border-ink/50"
                } ${includesAll ? "cursor-default" : ""}`}
              >
                <span className="relative aspect-square w-10 shrink-0 bg-white">
                  <Image
                    src={a.image}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain transition-transform duration-500 ease-(--ease-luxe) group-hover:scale-110"
                  />
                </span>
                <span className="text-[13px] leading-tight">{a.name}</span>
                {selected && (
                  <span className="absolute -right-1.5 -top-1.5 grid size-5 animate-pop place-items-center rounded-full bg-ink text-ivory">
                    <CheckIcon className="size-3" strokeWidth={2} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex gap-3">
        <QtyStepper qty={qty} setQty={setQty} />
        <button
          type="button"
          disabled={remaining !== 0 || combo.stock <= 0}
          onClick={() => {
            add(
              {
                variantId: combo.variantId,
                slug: combo.slug,
                name: combo.name,
                image: combo.image,
                variant: combo.variantLabel,
                price: combo.price,
                selections: [...picked].sort(),
              },
              qty,
            );
            if (!includesAll) setPicked([]);
            flash();
          }}
          className="btn btn-dark flex-1 active:scale-[0.98]"
        >
          {added ? <AddedLabel /> : combo.stock <= 0 ? "Sold out" : remaining === 0 ? `Add to Bag · ${formatPrice(combo.price * qty)}` : `Select ${remaining} more`}
        </button>
      </div>
      <AskOnWhatsApp name={combo.name} />
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { checkPincodeAction, type DeliveryEstimate } from "@/app/(store)/checkout/actions";
import { track } from "@/components/analytics";
import { Spinner } from "@/components/ui/form";
import { useStore } from "@/components/store-context";
import { formatPrice } from "@/lib/format";

/** Records the view for "Recently viewed" and sends GA4 view_item. */
export function ProductViewTracker({ slug }: { slug: string }) {
  const { markViewed, bySlug } = useStore();
  useEffect(() => {
    markViewed(slug);
    const p = bySlug.get(slug);
    if (p) track("view_item", { value: p.priceFrom, items: [{ item_id: p.slug, item_name: p.name, price: p.priceFrom }] });
    // Once per product page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  return null;
}

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const { recentlyViewed, bySlug } = useStore();
  const items = recentlyViewed
    .filter((s) => s !== currentSlug)
    .map((s) => bySlug.get(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section className="section-y !pt-0">
      <div className="container-x">
        <p className="eyebrow">Recently viewed</p>
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.slug}>
              <Link href={`/product/${p.slug}`} className="group flex items-center gap-3 border border-line bg-white p-3 transition-colors hover:border-ink">
                <span className="relative size-16 shrink-0">
                  <Image src={p.image} alt="" fill sizes="64px" className="object-contain transition-transform duration-500 group-hover:scale-110" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-serif text-lg leading-tight">{p.name}</span>
                  <span className="text-[13px] text-muted">From {formatPrice(p.priceFrom)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function PincodeCheck() {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DeliveryEstimate | null>(null);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setResult({ serviceable: false, etd: null, days: null });
      return;
    }
    setBusy(true);
    setResult(await checkPincodeAction(pin));
    setBusy(false);
  }

  return (
    <form onSubmit={check} className="mt-6">
      <label htmlFor="pin-check" className="text-[12px] uppercase tracking-[0.04em] text-muted">
        Check delivery
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="pin-check"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            setResult(null);
          }}
          inputMode="numeric"
          placeholder="Enter PIN code"
          className="h-11 min-w-0 flex-1 border border-line bg-white px-3 text-sm outline-none focus:border-ink"
        />
        <button className="btn btn-outline h-11 px-5" disabled={busy}>
          {busy ? <Spinner /> : "Check"}
        </button>
      </div>
      {result && (
        <p className={`mt-2 text-[13px] ${result.serviceable === false ? "text-red-700" : "text-ink-soft"}`} role="status">
          {result.serviceable === false
            ? /^[1-9]\d{5}$/.test(pin)
              ? "Sorry, we don't deliver to this PIN code yet."
              : "Enter a valid 6-digit PIN code."
            : result.etd
              ? `Delivers by ${result.etd}. Free shipping above ₹299.`
              : `Usually delivered in ${result.days ?? "3-7"} days. Free shipping above ₹299.`}
        </p>
      )}
    </form>
  );
}

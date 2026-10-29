"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import { track } from "./analytics";
import { CloseIcon, SearchIcon } from "./icons";
import { useStore } from "./store-context";

const suggestions = ["Oud", "Musk", "Fresh", "Gift set", "Rose", "Daily wear"];

/** Instant product search over the cached catalog index. Opens from the header search icon or "/" key. */
export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { products } = useStore();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return products
      .map((p) => ({ p, score: terms.reduce((n, t) => n + (p.name.toLowerCase().includes(t) ? 3 : p.keywords.includes(t) ? 1 : -10), 0) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.p);
  }, [q, products]);

  useEffect(() => {
    if (q.trim().length < 3) return;
    const t = setTimeout(() => track("search", { search_term: q.trim() }), 1200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className={`fixed inset-0 z-[80] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-espresso/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        inert={!open}
        className={`absolute inset-x-0 top-0 max-h-[85svh] overflow-y-auto bg-ivory shadow-2xl transition-transform duration-500 ease-(--ease-luxe) ${open ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="container-x py-5 sm:py-8">
          <div className="flex items-center gap-3 border-b border-ink/20 pb-3">
            <SearchIcon className="size-6 shrink-0 text-muted" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search attars, notes, gift sets…"
              aria-label="Search"
              className="min-w-0 flex-1 bg-transparent font-serif text-3xl outline-none placeholder:text-muted/50 sm:text-4xl"
            />
            <button type="button" onClick={onClose} aria-label="Close search" className="grid size-10 place-items-center">
              <CloseIcon className="size-6" />
            </button>
          </div>

          {!q.trim() ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted">Try</span>
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => setQ(s)} className="rounded-full border border-line px-4 py-1.5 text-sm hover:border-ink">
                  {s}
                </button>
              ))}
            </div>
          ) : results.length === 0 ? (
            <p className="mt-8 text-muted">No products match &ldquo;{q}&rdquo;. Try a note like oud, musk or rose.</p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <li key={p.slug}>
                  <Link href={`/product/${p.slug}`} onClick={onClose} className="group flex items-center gap-4 border border-line bg-white p-3 transition-colors hover:border-ink">
                    <span className="relative size-16 shrink-0 overflow-hidden bg-white">
                      <Image src={p.image} alt="" fill sizes="64px" className="object-contain transition-transform duration-500 group-hover:scale-110" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-xl leading-tight">{p.name}</span>
                      <span className="block truncate text-[13px] text-muted">{p.subtitle}</span>
                      <span className="text-sm">From {formatPrice(p.priceFrom)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

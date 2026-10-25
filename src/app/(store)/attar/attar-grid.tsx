"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Attar } from "@/data/types";

const filters = ["All", "Best Seller", "Men", "Women", "Oud", "Musk", "Fresh", "Woody"];
const sorts = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
} as const;

type SortKey = keyof typeof sorts;

/** Client-side filter + sort around server-rendered product cards. */
export function AttarGrid({ attars, cards }: { attars: Attar[]; cards: Record<string, ReactNode> }) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<SortKey>("featured");

  const visible = useMemo(() => {
    const list = filter === "All" ? attars : attars.filter((a) => a.categories.includes(filter));
    if (sort === "featured") return list;
    const dir = sort === "price-asc" ? 1 : -1;
    return [...list].sort((a, b) => (a.sizes[0].price - b.sizes[0].price) * dir);
  }, [attars, filter, sort]);

  return (
    <>
      <div className="sticky top-16 z-30 -mx-5 border-b border-line bg-ivory/95 px-5 backdrop-blur-md sm:-mx-6 sm:px-6 md:top-20 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between gap-4 py-4">
          <div className="no-scrollbar -my-1 flex gap-2 overflow-x-auto py-1" role="group" aria-label="Filter by family">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`h-9 shrink-0 rounded-full border px-4 text-[12px] uppercase tracking-[0.04em] transition-colors ${
                  filter === f ? "border-ink bg-ink text-ivory" : "border-line text-ink-soft hover:border-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="hidden shrink-0 items-center gap-2 text-[12px] uppercase tracking-[0.04em] text-muted md:flex">
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-9 border border-line bg-transparent px-3 text-[13px] normal-case tracking-normal text-ink"
            >
              {Object.entries(sorts).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-8 text-[13px] text-muted" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "attar" : "attars"}
      </p>
      <div className="reveal-stagger mt-6 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-y-14">
        {visible.map((a) => (
          <div key={a.slug}>{cards[a.slug]}</div>
        ))}
      </div>
    </>
  );
}

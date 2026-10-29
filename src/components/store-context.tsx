"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setWishlistAction, syncWishlistAction } from "@/app/(store)/wishlist/actions";
import type { ProductSummary } from "@/data/types";
import { track } from "./analytics";

type StoreContextValue = {
  products: ProductSummary[];
  bySlug: Map<string, ProductSummary>;
  wishlist: number[];
  isWished: (productId: number) => boolean;
  toggleWish: (product: ProductSummary) => void;
  recentlyViewed: string[];
  markViewed: (slug: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const WISH_KEY = "dn-wishlist-v1";
const RECENT_KEY = "dn-recent-v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Product index + wishlist + recently viewed, shared by every storefront page. */
export function StoreProvider({ products, children }: { products: ProductSummary[]; children: ReactNode }) {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [recentlyViewed, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const local = read<number[]>(WISH_KEY, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted state after mount
    setWishlist(local);
    setRecent(read<string[]>(RECENT_KEY, []));
    // Signed-in customers keep their wishlist on their account across devices.
    syncWishlistAction(local).then((server) => {
      if (server) {
        setWishlist(server);
        write(WISH_KEY, server);
      }
    });
  }, []);

  const toggleWish = useCallback(
    (product: ProductSummary) => {
      const saved = !wishlist.includes(product.id);
      const next = saved ? [product.id, ...wishlist] : wishlist.filter((id) => id !== product.id);
      setWishlist(next);
      write(WISH_KEY, next);
      void setWishlistAction(product.id, saved);
      if (saved) track("add_to_wishlist", { value: product.priceFrom, items: [{ item_id: product.slug, item_name: product.name, price: product.priceFrom }] });
    },
    [wishlist],
  );

  const markViewed = useCallback((slug: string) => {
    setRecent((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 12);
      write(RECENT_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const live = new Set(products.map((p) => p.id));
    return {
      products,
      bySlug: new Map(products.map((p) => [p.slug, p])),
      wishlist: wishlist.filter((id) => live.has(id)),
      isWished: (id) => wishlist.includes(id),
      toggleWish,
      recentlyViewed,
      markViewed,
    };
  }, [products, wishlist, toggleWish, recentlyViewed, markViewed]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

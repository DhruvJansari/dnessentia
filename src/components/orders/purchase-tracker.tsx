"use client";

import { useEffect } from "react";
import { track } from "../analytics";

/** Fires the GA4 purchase event once per order (guarded in localStorage so refreshes don't double count). */
export function PurchaseTracker({ orderNumber, value, items }: { orderNumber: string; value: number; items: { id: string; name: string; variant: string; price: number; qty: number }[] }) {
  useEffect(() => {
    const key = `dn-tracked-${orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    track("purchase", {
      transaction_id: orderNumber,
      value,
      items: items.map((i) => ({ item_id: i.id, item_name: i.name, item_variant: i.variant, price: i.price, quantity: i.qty })),
    });
  }, [orderNumber, value, items]);
  return null;
}

"use client";

import { CartLines, CartSuggestions, CartSummary, EmptyCart, FreeShippingMeter } from "@/components/cart/cart-contents";
import { useCart } from "@/components/cart/cart-context";

export function CartView() {
  const { items, subtotal } = useCart();
  if (items.length === 0) return <EmptyCart />;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <div className="border-t border-line">
        <CartLines />
        <CartSuggestions limit={4} />
      </div>
      <aside className="h-fit space-y-6 bg-cream p-6 sm:p-8 lg:sticky lg:top-28">
        <FreeShippingMeter subtotal={subtotal} />
        <CartSummary />
      </aside>
    </div>
  );
}

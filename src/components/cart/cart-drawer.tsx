"use client";

import { useEffect } from "react";
import { CloseIcon } from "../icons";
import { CartLines, CartSummary, EmptyCart, FreeShippingMeter } from "./cart-contents";
import { useCart } from "./cart-context";

export function CartDrawer() {
  const { isOpen, close, items, count, subtotal } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <div className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-espresso/40 backdrop-blur-[2px] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        inert={!isOpen}
        className={`absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-ivory shadow-2xl transition-transform duration-500 ease-(--ease-luxe) ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-5 sm:px-7">
          <h2 className="font-serif text-3xl">
            Your Bag <span className="align-top font-sans text-sm text-muted">({count})</span>
          </h2>
          <button type="button" onClick={close} aria-label="Close bag" className="-mr-2 grid size-10 place-items-center">
            <CloseIcon className="size-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex-1 px-5 sm:px-7">
            <EmptyCart onNavigate={close} />
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4 sm:px-7">
              <FreeShippingMeter subtotal={subtotal} />
            </div>
            <div className="flex-1 overflow-y-auto px-5 sm:px-7">
              <CartLines onNavigate={close} />
            </div>
            <div className="border-t border-line bg-cream px-5 py-6 sm:px-7">
              <CartSummary onNavigate={close} />
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

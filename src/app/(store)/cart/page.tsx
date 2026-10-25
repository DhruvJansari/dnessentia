import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { CartView } from "./cart-view";

export const metadata: Metadata = {
  title: "Your Bag",
  robots: { index: false },
};

export default function CartPage() {
  return (
    <>
      <PageHeader crumbs={[{ href: "/", label: "Home" }, { label: "Bag" }]} eyebrow="Checkout" title="Your Bag" />
      <section className="container-x section-y !pt-8 md:!pt-12">
        <CartView />
      </section>
    </>
  );
}

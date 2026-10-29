import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { WishlistView } from "./wishlist-view";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Wishlist" }]}
        eyebrow="Saved for later"
        title={
          <>
            Your <em>wishlist</em>
          </>
        }
        description="Fragrances you've saved. Log in to keep them on every device."
      />
      <section className="container-x section-y !pt-10">
        <WishlistView />
      </section>
    </>
  );
}

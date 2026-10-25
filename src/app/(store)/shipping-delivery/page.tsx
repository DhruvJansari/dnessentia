import type { Metadata } from "next";
import { ContactCard } from "@/components/contact-card";
import { ProsePage } from "@/components/prose-page";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: `Free shipping on DN Essentia orders above ₹${site.freeShippingThreshold}. Delivered across India in 3–7 business days.`,
};

export default function ShippingPage() {
  return (
    <ProsePage
      title="Shipping & Delivery"
      eyebrow="Customer Care"
      intro="Every order is packed with care in premium protective packaging and shipped across India."
      sections={[
        {
          heading: "Shipping charges",
          body: [`Enjoy free shipping on all orders above ₹${site.freeShippingThreshold}. A small shipping fee applies to orders below this amount.`],
        },
        {
          heading: "Delivery time",
          body: ["Orders are usually delivered within 3–7 business days depending on your location."],
        },
        {
          heading: "Cash on Delivery",
          body: ["Cash on Delivery may be available on selected orders and locations."],
        },
        {
          heading: "Damaged in transit",
          body: [
            "If your package arrives damaged or leaking, contact us within 3 days of delivery with your order details and a clear unboxing video, and we'll arrange a replacement.",
          ],
        },
      ]}
    >
      <ContactCard />
    </ProsePage>
  );
}

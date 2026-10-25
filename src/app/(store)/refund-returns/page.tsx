import type { Metadata } from "next";
import { ContactCard } from "@/components/contact-card";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Refund & Return Policy",
  description: "Returns, replacements, refunds and cancellations at DN Essentia.",
};

export default function RefundReturnsPage() {
  return (
    <ProsePage
      title="Returns & Refunds"
      eyebrow="Customer Care"
      updated="May 2026"
      intro="We strive to provide premium-quality fragrance and excellent service. If something isn't right with your order, here's how we'll make it right."
      sections={[
        {
          heading: "Eligible return reasons",
          body: ["You may request a return or replacement if:"],
          list: [
            "You received a damaged or leaked product",
            "You received the wrong product",
            "The product significantly differs from the description on the website",
            "You received the wrong size or variant",
            "You are not satisfied with the fragrance product received",
          ],
        },
        {
          heading: "Unboxing video required",
          body: [
            "For complaints about damaged products, empty packages, missing items or leakage during delivery, please provide a clear unboxing video of the package. Without it, your complaint may not be accepted.",
          ],
        },
        {
          heading: "Non-returnable products",
          list: [
            "Used or opened products",
            "Products with broken seals",
            "Customised or personalised products",
            "Products purchased during sale or discount offers",
            "Consumable products once opened",
          ],
        },
        {
          heading: "Return conditions",
          list: [
            "Products must be unused and in original condition",
            "Original packaging, labels and tags must remain intact",
            "Return requests must be made within 3 days of delivery",
            "Approved returns must be shipped back within 7 days",
            "Replacement products are subject to stock availability",
          ],
        },
        {
          heading: "Refund process",
          body: [
            "To request a refund or raise a dispute, contact us with your order ID, product images or videos, and a detailed explanation of the issue. Refunds are processed only after product verification and approval by our support team.",
          ],
        },
        {
          heading: "Cancellation policy",
          list: [
            "Orders cannot be cancelled after 12 hours of placing the order",
            "Customised orders cannot be cancelled",
            "Orders can only be cancelled before dispatch",
            "DN Essentia reserves the right to cancel orders due to pricing errors or stock unavailability",
          ],
        },
      ]}
    >
      <ContactCard />
    </ProsePage>
  );
}

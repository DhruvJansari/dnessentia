import type { Metadata } from "next";
import { ContactCard } from "@/components/contact-card";
import { ProsePage } from "@/components/prose-page";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms for buying from DN Essentia: orders, pricing, payment, delivery, cancellation and replacements.",
};

export default function TermsPage() {
  return (
    <ProsePage
      title="Terms & Conditions"
      eyebrow="Legal"
      updated="October 2026"
      intro="These terms apply to every purchase on this website. By placing an order you agree to them."
      sections={[
        {
          heading: "About us",
          body: [
            `This website is operated by DN Essentia. You can reach us at ${site.email} or on WhatsApp at ${site.whatsappDisplay}.`,
          ],
        },
        {
          heading: "Products",
          body: [
            "Our attars are concentrated, alcohol-free perfume oils. Colours and packaging may vary slightly from the photos. Every skin is different, so we recommend a patch test before regular use. Stop using a product if irritation occurs.",
            "Products are for external use only. Keep away from eyes, children and open flames.",
          ],
        },
        {
          heading: "Prices and payment",
          list: [
            "All prices are in Indian Rupees and include GST.",
            "Shipping charges, if any, are shown at checkout before you pay.",
            "Online payments are processed securely by Razorpay. We never see or store your card details.",
            "We may correct pricing errors and cancel affected orders with a full refund.",
          ],
        },
        {
          heading: "Orders",
          body: [
            "An order is confirmed once payment succeeds (or, for Cash on Delivery where offered, once we confirm it). You'll receive a confirmation email with your order number and a GST invoice.",
            "We may cancel orders for stock unavailability, suspected fraud or undeliverable addresses. In such cases you receive a full refund.",
          ],
        },
        {
          heading: "Shipping",
          body: [
            "We ship across India through our courier partners. Orders are usually delivered within 3-7 business days. Delivery estimates shown at checkout are indicative.",
          ],
        },
        {
          heading: "Cancellation",
          list: [
            "You can cancel an order from your order page within 12 hours of placing it, as long as it hasn't been handed to the courier.",
            "For prepaid orders, a cancellation charge of 50% of the order value applies. The remaining 50% is refunded to the original payment method within 5-7 business days.",
            "Orders that are unpaid, or Cash on Delivery orders, can be cancelled at no charge within the same window.",
            "Orders cannot be cancelled after they are dispatched.",
          ],
        },
        {
          heading: "No returns, replacement only",
          list: [
            "We do not accept returns or offer refunds on delivered products.",
            "If your product arrives damaged, leaked, wrong or missing, request a replacement from your order page within 3 days of delivery.",
            "A clear unboxing video is required for damage, leakage and missing-item claims.",
            "Approved claims receive a replacement of the product only. Delivery and packaging charges are not refundable.",
          ],
        },
        {
          heading: "Coupons and offers",
          body: [
            "Coupons have their own conditions (minimum order, validity, usage limits) shown at checkout. Free gifts are subject to stock and can't be exchanged for cash.",
          ],
        },
        {
          heading: "Accounts",
          body: [
            "You're responsible for keeping your password confidential. We may suspend accounts that misuse the website or our offers.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "To the extent permitted by law, our liability for any order is limited to the amount you paid for it. We aren't responsible for delays caused by couriers or events outside our control.",
          ],
        },
        {
          heading: "Governing law",
          body: [
            "These terms are governed by the laws of India. Disputes are subject to the jurisdiction of the courts where DN Essentia is registered.",
          ],
        },
        {
          heading: "Changes",
          body: ["We may update these terms. The version on this page at the time of your order applies to that order."],
        },
      ]}
    >
      <ContactCard title="Questions about these terms?" />
    </ProsePage>
  );
}

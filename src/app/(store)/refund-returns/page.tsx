import type { Metadata } from "next";
import { ContactCard } from "@/components/contact-card";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Cancellation, Replacement & Refund Policy",
  description: "Cancel within 12 hours (50% charge on prepaid orders). No returns; damaged, leaked, wrong or missing products are replaced.",
};

export default function RefundReturnsPage() {
  return (
    <ProsePage
      title="Cancellation & Replacement"
      eyebrow="Customer Care"
      updated="October 2026"
      intro="We want every bottle to reach you perfect. Here's exactly what happens if you change your mind before dispatch, or if something arrives wrong."
      sections={[
        {
          heading: "Cancelling an order",
          list: [
            "Cancel from your order page (or the link in your confirmation email) within 12 hours of ordering, before the order is dispatched.",
            "Prepaid orders: a 50% cancellation charge applies, and the other 50% is refunded to your original payment method within 5-7 business days.",
            "Unpaid orders and Cash on Delivery orders cancel at no charge within the same window.",
            "Once an order is dispatched it can't be cancelled.",
          ],
        },
        {
          heading: "No returns",
          body: [
            "Because attars are personal-care products, we don't accept returns or offer refunds on delivered orders, including for change of mind or fragrance preference.",
          ],
        },
        {
          heading: "Replacement for damaged, leaked, wrong or missing items",
          list: [
            "Request a replacement from your order page within 3 days of delivery.",
            "Choose the affected products, tell us what happened and share a clear unboxing video link (required for damage, leakage and missing items) and photos.",
            "We review every request within 1-2 business days and email you the decision.",
            "Approved requests get a replacement of the product, shipped free. Delivery and packaging charges of the original order are not refundable.",
          ],
        },
        {
          heading: "Not eligible",
          list: [
            "Used or opened products, unless they arrived damaged or leaked",
            "Requests made more than 3 days after delivery",
            "Damage or leakage claims without an unboxing video",
          ],
        },
        {
          heading: "Refund timelines",
          body: [
            "Refunds from cancellations are issued through Razorpay to the original payment method. Banks usually credit them within 5-7 business days.",
          ],
        },
      ]}
    >
      <ContactCard />
    </ProsePage>
  );
}

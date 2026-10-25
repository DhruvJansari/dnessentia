import type { Metadata } from "next";
import { ContactCard } from "@/components/contact-card";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DN Essentia collects, uses and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <ProsePage
      title="Privacy Policy"
      eyebrow="Legal"
      updated="May 2026"
      intro="Your privacy is important to us. This policy explains how we collect, use and protect your personal information when you use our website and services."
      sections={[
        {
          heading: "Information we collect",
          list: [
            "Full name, phone number and email address",
            "Billing and shipping address",
            "Payment information",
            "Order details and purchase history",
            "IP address and device information",
            "Cookies and website usage data",
          ],
        },
        {
          heading: "How we use your information",
          list: [
            "Process and deliver your orders",
            "Provide customer support",
            "Send order updates and notifications",
            "Improve website functionality and user experience",
            "Prevent fraud and unauthorised transactions",
            "Send promotional offers and marketing communications",
          ],
        },
        {
          heading: "Cookies & tracking",
          body: [
            "We may use cookies and similar technologies to improve website performance, analyse visitor activity, remember your preferences and enhance your shopping experience. You may disable cookies through your browser settings.",
          ],
        },
        {
          heading: "Data protection & security",
          body: [
            "We use secure systems and industry-standard security measures to protect your personal information from unauthorised access, misuse or disclosure. However, no online platform can guarantee complete security.",
          ],
        },
        {
          heading: "Third-party services",
          body: [
            "We may share limited information with trusted payment gateways, shipping partners, analytics providers and marketing platforms. These providers only receive the information necessary to perform their services securely.",
          ],
        },
        {
          heading: "Your rights",
          list: [
            "Access your personal information",
            "Request correction of inaccurate data",
            "Request deletion of your information",
            "Opt out of promotional communications",
          ],
        },
        {
          heading: "Policy updates",
          body: ["DN Essentia may update this Privacy Policy at any time. Changes will be posted on this page."],
        },
      ]}
    >
      <ContactCard title="Questions about your data?" />
    </ProsePage>
  );
}

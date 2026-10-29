import type { Metadata } from "next";
import { Suspense } from "react";
import { InstagramIcon, MailIcon, WhatsAppIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { site } from "@/data/site";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with DN Essentia for orders, delivery and product questions. Email, WhatsApp or the contact form.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "Contact" }]}
        eyebrow="Customer care"
        title={
          <>
            We&apos;d love to <em>hear from you</em>
          </>
        }
        description="Questions about an order, a fragrance or a gift? Write to us and we'll reply within one business day."
      />
      <section className="container-x section-y !pt-12 md:!pt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
          <div className="reveal">
            <ContactForm />
          </div>
          <aside className="space-y-6">
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex gap-4 border border-line bg-white p-5 transition-colors hover:border-ink">
              <WhatsAppIcon className="size-6 shrink-0 text-[#25d366]" />
              <span>
                <span className="block font-medium">WhatsApp</span>
                <span className="text-sm text-muted">{site.whatsappDisplay} · fastest reply</span>
              </span>
            </a>
            <a href={`mailto:${site.email}`} className="flex gap-4 border border-line bg-white p-5 transition-colors hover:border-ink">
              <MailIcon className="size-6 shrink-0 text-gold" />
              <span>
                <span className="block font-medium">Email</span>
                <span className="text-sm text-muted">{site.email}</span>
              </span>
            </a>
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="flex gap-4 border border-line bg-white p-5 transition-colors hover:border-ink">
              <InstagramIcon className="size-6 shrink-0 text-gold" />
              <span>
                <span className="block font-medium">Instagram</span>
                <span className="text-sm text-muted">@dnessentia_official</span>
              </span>
            </a>
            <Suspense fallback={<div className="h-32 animate-pulse bg-sand" />}>
              <BusinessAddress />
            </Suspense>
          </aside>
        </div>
      </section>
    </>
  );
}

async function BusinessAddress() {
  const { business, store } = await getSettings();
  const lines = [business.addressLine1, business.addressLine2, [business.city, business.state, business.pincode].filter(Boolean).join(", ")].filter(Boolean);
  return (
    <div className="border border-line bg-cream p-5 text-sm leading-relaxed">
      <p className="font-medium">{business.legalName}</p>
      {lines.map((l) => (
        <p key={l} className="text-ink-soft">
          {l}
        </p>
      ))}
      {business.gstin && <p className="mt-2 text-muted">GSTIN {business.gstin}</p>}
      <p className="mt-2 text-muted">Support hours: Mon to Sat, 10 am to 7 pm · {store.supportPhone}</p>
    </div>
  );
}

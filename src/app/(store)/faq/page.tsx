import type { Metadata } from "next";
import { ContactCard } from "@/components/contact-card";
import { PageHeader } from "@/components/page-header";
import { faqs } from "@/data/site";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Answers about DN Essentia attars: longevity, application, storage, shipping, COD and more.",
};

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: Array.isArray(f.a) ? f.a.join(" ") : f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHeader
        crumbs={[{ href: "/", label: "Home" }, { label: "FAQs" }]}
        eyebrow="Help Centre"
        title={
          <>
            Frequently asked <em>questions</em>
          </>
        }
        description="Everything you need to know about our attars, orders and delivery."
      />
      <section className="container-x section-y !pt-10 md:!pt-14">
        <div className="mx-auto max-w-3xl">
          <div className="border-t border-line">
            {faqs.map((f, i) => (
              <details key={f.q} open={i === 0} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="font-serif text-2xl leading-snug sm:text-[1.75rem]">{f.q}</span>
                  <span
                    aria-hidden
                    className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-line text-lg transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="space-y-3 pb-7 pr-12 text-ink-soft">
                  {(Array.isArray(f.a) ? f.a : [f.a]).map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <ContactCard title="Still have a question?" />
        </div>
      </section>
    </>
  );
}

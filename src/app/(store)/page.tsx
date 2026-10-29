import { BestSellers } from "@/components/home/best-sellers";
import { Collections } from "@/components/home/collections";
import { Hero } from "@/components/home/hero";
import { Reviews } from "@/components/home/reviews";
import { TrustBar } from "@/components/home/trust-bar";
import { WhyUs } from "@/components/home/why-us";
import { site } from "@/data/site";

const organization = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#org`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/images/brand/logo-square.jpg`,
      sameAs: [site.instagram],
      contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: site.email, telephone: site.whatsappDisplay, areaServed: "IN" },
    },
    { "@type": "WebSite", "@id": `${site.url}/#website`, url: site.url, name: site.name, publisher: { "@id": `${site.url}/#org` } },
  ],
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <Hero />
      <TrustBar />
      <Collections />
      <BestSellers />
      <WhyUs />
      <Reviews />
    </>
  );
}

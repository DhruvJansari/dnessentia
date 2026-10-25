import { BestSellers } from "@/components/home/best-sellers";
import { Collections } from "@/components/home/collections";
import { Hero } from "@/components/home/hero";
import { Reviews } from "@/components/home/reviews";
import { TrustBar } from "@/components/home/trust-bar";
import { WhyUs } from "@/components/home/why-us";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Collections />
      <BestSellers />
      <WhyUs />
      <Reviews />
    </>
  );
}

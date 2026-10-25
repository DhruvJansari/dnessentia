import type { MetadataRoute } from "next";
import { site } from "@/data/site";
import { getAllSlugs } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/attar", "/combo-collection", "/about", "/faq", "/shipping-delivery", "/refund-returns", "/privacy-policy"];
  const products = (await getAllSlugs()).map((slug) => `/product/${slug}`);
  return [...pages, ...products].map((path) => ({ url: `${site.url}${path}` }));
}

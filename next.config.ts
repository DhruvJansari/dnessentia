import type { NextConfig } from "next";

// Old WordPress URLs that differ from the new routes, kept so existing links and search results still land.
const legacyRedirects: [string, string][] = [
  ["/product/attar-collection-for-men-women", "/product/ultimate-collection"],
  ["/product/luxury-attar-for-men-women", "/product/luxury-pack"],
  ["/product/premium-pack-for-men", "/product/premium-pack"],
  ["/product/explorer-attar-pack-choose-any-3-premium-attars-3-ml-dn-essentia", "/product/explorer-pack"],
  ["/product/pure-appeal-attar-elegant-perfume-oil-dn-essentia", "/product/pure-apeal"],
  ["/product/best-long-lasting-attar-for-men", "/product/oud-legacy"],
  ["/product/aqua-mist-attar-premium-alcohol-free-perfume-dn-essentia", "/product/aqua-mist"],
  ["/shop", "/attar"],
  ["/new-shop-page", "/attar"],
  ["/premium-attar-perfumes", "/attar"],
  ["/refund_returns", "/refund-returns"],
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.3'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    // Product image uploads from the admin go through a Server Action (images are capped at 5 MB there).
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return legacyRedirects.map(([source, destination]) => ({
      source,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;

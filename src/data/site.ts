export const site = {
  name: "DN Essentia",
  // Public origin for canonical URLs, sitemap and structured data (server-side). Follows APP_URL.
  url: (process.env.APP_URL || "https://dnessentia.com").replace(/\/$/, ""),
  // Only the real domain is indexed. Test domains (dnessentia.in, localhost) are hidden from search engines.
  indexable: (process.env.APP_URL || "https://dnessentia.com").replace(/\/$/, "") === "https://dnessentia.com",
  tagline: "Premium alcohol-free attars",
  description:
    "Premium alcohol-free attars made from 100% concentrated fragrance oils. Long-lasting, skin-friendly perfume oils for men and women.",
  freeShippingThreshold: 299,
  whatsapp: "919274700645",
  whatsappDisplay: "+91 92747 00645",
  email: "info@dnessentia.com",
  instagram: "https://www.instagram.com/dnessentia_official/",
  copyrightYear: 2026,
};

export const mainNav = [
  { href: "/", label: "Home" },
  { href: "/attar", label: "Attar" },
  { href: "/combo-collection", label: "Combo Collection" },
  { href: "/about", label: "About" },
];

export const footerNav = {
  shop: [
    { href: "/attar", label: "All Attars" },
    { href: "/combo-collection", label: "Combo Collection" },
    { href: "/product/royal-oud", label: "Royal Oud" },
    { href: "/product/ultimate-collection", label: "Ultimate Collection" },
  ],
  help: [
    { href: "/faq", label: "FAQs" },
    { href: "/shipping-delivery", label: "Shipping & Delivery" },
    { href: "/refund-returns", label: "Cancellation & Replacement" },
    { href: "/terms", label: "Terms & Conditions" },
    { href: "/privacy-policy", label: "Privacy Policy" },
  ],
  company: [
    { href: "/about", label: "Our Story" },
    { href: "/contact", label: "Contact Us" },
    { href: "/account", label: "My Account" },
    { href: "/track", label: "Track Order" },
  ],
};

/** Real Google reviews, as shown by the Trustindex widget on the WordPress site. */
export const reviews = [
  {
    name: "krunal prajapati",
    source: "Google" as const,
    date: "September 2026",
    rating: 5,
    avatarColor: "#ab47bc",
    text: [
      "Amazing fragrance at an amazing price! ❤️",
      "I recently tried Dnessentia Attar and absolutely loved the fragrance. It smells premium, classy and very pleasant, and the quality is honestly impressive considering the price.",
      "What I liked most is that you get a premium fragrance experience without spending too much. Definitely worth trying if you love good fragrances.",
      "Highly recommended! 👌🔥 Will definitely try more fragrances from Dnessentia.",
    ],
  },
  {
    name: "Mayank Panchal",
    source: "Google" as const,
    date: "July 2026",
    rating: 5,
    avatarColor: "#78909c",
    text: ["Best for premium attar 👌"],
  },
];

export const faqs: { q: string; a: string | string[] }[] = [
  {
    q: "What is attar?",
    a: "Attar is a premium concentrated fragrance oil crafted from aromatic ingredients such as woods, spices, florals, and essential oils. It is known for its rich aroma and long-lasting fragrance experience.",
  },
  {
    q: "Are DN Essentia attars alcohol-free?",
    a: "Yes. All DN Essentia attars are crafted with alcohol-free formulations for a smooth and luxurious fragrance experience.",
  },
  {
    q: "How long does the fragrance last?",
    a: "Our attars are designed for long-lasting performance and can stay for several hours depending on skin type, weather, and fragrance notes.",
  },
  {
    q: "How should I apply attar?",
    a: [
      "Apply attar directly on pulse points such as the wrists, neck, behind the ears and inner elbows.",
      "For enhanced performance, apply on moisturised skin.",
    ],
  },
  {
    q: "Can men and women both use these fragrances?",
    a: "Yes. DN Essentia offers fragrances for men, women, and unisex preferences.",
  },
  {
    q: "Why does the fragrance smell different on every person?",
    a: "Each fragrance interacts naturally with individual body chemistry, temperature, and skin type, creating a unique scent experience.",
  },
  {
    q: "How should I store my attar?",
    a: "Keep it in a cool, dry place, away from direct sunlight, with the cap tightly closed after use.",
  },
  {
    q: "Can I use attar daily?",
    a: "Absolutely. Our attars are perfect for everyday wear as well as special occasions.",
  },
  {
    q: "What makes DN Essentia unique?",
    a: "Premium-quality fragrance oils, long-lasting performance, alcohol-free formulations, a luxury-inspired fragrance experience, and elegant packaging and presentation.",
  },
  {
    q: "Do you offer Cash on Delivery (COD)?",
    a: "Cash on Delivery may be available on selected orders and locations.",
  },
  {
    q: "How long does shipping take?",
    a: "Orders are usually delivered within 3–7 business days depending on your location.",
  },
  {
    q: "What if I receive a damaged product?",
    a: "Request a replacement from your order page within 3 days of delivery, with photos and your unboxing video link. Approved requests get a free replacement of the product.",
  },
  {
    q: "Can I cancel my order?",
    a: "Yes, within 12 hours of ordering and before dispatch, from your order page. Prepaid orders carry a 50% cancellation charge; the rest is refunded within 5-7 business days.",
  },
  {
    q: "Do you accept returns?",
    a: "We don't accept returns on delivered products. Damaged, leaked, wrong or missing items are replaced.",
  },
  {
    q: "Are DN Essentia fragrances suitable for gifting?",
    a: "Yes. Our fragrances come in premium packaging, making them an excellent choice for birthdays, weddings, festivals, and special occasions.",
  },
];


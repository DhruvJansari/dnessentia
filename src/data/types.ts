export type AttarSize = {
  /** Variant id in the database. */
  id: number;
  label: string;
  price: number;
  stock: number;
};

export type Rating = { average: number; count: number };

export type Attar = {
  id: number;
  rating: Rating | null;
  slug: string;
  name: string;
  image: string;
  gallery: string[];
  character: string;
  bestFor: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  about: string;
  categories: string[];
  sizes: AttarSize[];
};

export type Combo = {
  id: number;
  rating: Rating | null;
  slug: string;
  name: string;
  image: string;
  /** The single purchasable variant of the pack. */
  variantId: number;
  variantLabel: string;
  stock: number;
  price: number;
  regularPrice: number;
  /** How many attars the customer picks; 7 means the whole range is included. */
  pick: number;
  sizeMl: number;
  includes: string[];
  about: string;
  perfectFor: string[];
  howToUse: string;
  whyChoose: string[];
};

/** Small, serialisable product summary shared with client features (search, wishlist, recently viewed, cart suggestions). */
export type ProductSummary = {
  id: number;
  slug: string;
  type: "attar" | "combo";
  name: string;
  image: string;
  subtitle: string;
  priceFrom: number;
  keywords: string;
  rating: Rating | null;
  /** Cheapest in-stock variant, for one-click "add a sample". */
  quickVariant: { id: number; label: string; price: number } | null;
};

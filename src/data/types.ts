export type AttarSize = {
  /** Variant id in the database. */
  id: number;
  label: string;
  price: number;
  stock: number;
};

export type Attar = {
  id: number;
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

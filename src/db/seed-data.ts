// Seed data generated from the live WooCommerce catalog (dnessentia.com/wp-json/wc/store/v1/products).
// Used only by scripts/seed.ts; the storefront reads products from MySQL.
type SeedAttar = {
  id: number;
  slug: string;
  wpSlug: string;
  name: string;
  image: string;
  gallery: string[];
  character: string;
  bestFor: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  about: string;
  categories: string[];
  sizes: { id: number; label: string; price: number }[];
};

type SeedCombo = {
  id: number;
  slug: string;
  wpSlug: string;
  name: string;
  image: string;
  price: number;
  regularPrice: number;
  pick: number;
  sizeMl: number;
  includes: string[];
  about: string;
  perfectFor: string[];
  howToUse: string;
  whyChoose: string[];
};

export const attars: SeedAttar[] = [
  {
    "id": 134,
    "slug": "musk-velvet",
    "wpSlug": "musk-velvet",
    "name": "Musk Velvet",
    "image": "/images/products/musk-velvet.png",
    "gallery": [
      "/images/products/musk-velvet.png",
      "/images/gallery/musk-velvet.png"
    ],
    "character": "Modern • Confident • Sharp",
    "bestFor": "Daily Wear • Evening Outings • Date Nights",
    "notes": {
      "top": [
        "Cardamom",
        "Bergamot",
        "Pink Pepper"
      ],
      "heart": [
        "Iris",
        "Cashmeran",
        "Violet"
      ],
      "base": [
        "White Musk",
        "Amber",
        "Sandalwood"
      ]
    },
    "about": "Musk Velvet is the perfect attar for everyday elegance and special evening moments. Its soft yet sensual blend of clean musk, creamy woods, and delicate florals creates a warm and luxurious aura that suits office wear, casual outings, dinner dates, and festive occasions. Best enjoyed during cooler weather or nighttime, this long-lasting fragrance leaves a smooth, comforting impression wherever you go.",
    "categories": [
      "Best Seller",
      "Men",
      "Musk",
      "Signature"
    ],
    "sizes": [
      {
        "id": 1710,
        "label": "1 ml",
        "price": 79
      },
      {
        "id": 1711,
        "label": "3 ml",
        "price": 109
      },
      {
        "id": 1712,
        "label": "6 ml",
        "price": 169
      }
    ]
  },
  {
    "id": 119,
    "slug": "royal-oud",
    "wpSlug": "royal-oud",
    "name": "Royal Oud",
    "image": "/images/products/royal-oud.png",
    "gallery": [
      "/images/products/royal-oud.png",
      "/images/gallery/royal-oud-1.png"
    ],
    "character": "Luxurious • Powerful • Regal",
    "bestFor": "Weddings, festive occasions, evening wear, luxury events",
    "notes": {
      "top": [
        "Saffron",
        "Nutmeg",
        "Bergamot"
      ],
      "heart": [
        "Rose",
        "Patchouli",
        "Cedarwood"
      ],
      "base": [
        "Oud",
        "Amber",
        "Musk"
      ]
    },
    "about": "Royal Oud is a luxurious and sophisticated attar crafted for those who appreciate timeless elegance and bold character. Infused with the richness of premium oud, warm amber, exotic spices, and smooth woody notes, it delivers a deep and captivating aroma that feels royal, powerful, and refined. Long-lasting and intensely alluring, Royal Oud is designed to leave a majestic impression on every occasion.",
    "categories": [
      "Best Seller",
      "Men",
      "Oud",
      "Signature",
      "Women",
      "Woody"
    ],
    "sizes": [
      {
        "id": 1732,
        "label": "1 ml",
        "price": 79
      },
      {
        "id": 1733,
        "label": "3 ml",
        "price": 119
      },
      {
        "id": 1734,
        "label": "6 ml",
        "price": 179
      }
    ]
  },
  {
    "id": 50,
    "slug": "urban-man",
    "wpSlug": "urban-man",
    "name": "Urban Man",
    "image": "/images/products/urban-man.png",
    "gallery": [
      "/images/products/urban-man.png",
      "/images/gallery/urban-man.png"
    ],
    "character": "Fresh • Confident • Masculine",
    "bestFor": "Daily wear, Office use, Meeting, Occasions",
    "notes": {
      "top": [
        "Bergamot",
        "Lemon",
        "Black Pepper"
      ],
      "heart": [
        "Lavender",
        "Geranium",
        "Spicy Accord"
      ],
      "base": [
        "Cedarwood",
        "Amber",
        "Musk"
      ]
    },
    "about": "Urban Man is a bold and contemporary attar designed for the modern gentleman who carries confidence and style effortlessly. Blended with fresh citrus notes, aromatic spices, smooth woods, and soft musk, it creates a refreshing yet masculine fragrance that feels energetic, refined, and long-lasting. Perfect for everyday sophistication, Urban Man leaves a strong and memorable impression wherever you go.",
    "categories": [
      "Fresh",
      "Men",
      "Musk",
      "Women"
    ],
    "sizes": [
      {
        "id": 1735,
        "label": "1 ml",
        "price": 69
      },
      {
        "id": 1736,
        "label": "3 ml",
        "price": 99
      },
      {
        "id": 1737,
        "label": "6 ml",
        "price": 149
      }
    ]
  },
  {
    "id": 131,
    "slug": "the-touch",
    "wpSlug": "the-touch",
    "name": "The Touch",
    "image": "/images/products/the-touch.png",
    "gallery": [
      "/images/products/the-touch.png",
      "/images/gallery/thw-touch.png"
    ],
    "character": "Bold • Elegant • Captivating",
    "bestFor": "Evening wear, date nights, parties, special occasions",
    "notes": {
      "top": [
        "Green Apple",
        "Lemon",
        "Bergamot"
      ],
      "heart": [
        "Jasmine",
        "Lavender",
        "Marine Accord"
      ],
      "base": [
        "Musk",
        "Amber",
        "Cedarwood"
      ]
    },
    "about": "The Touch is a sophisticated and long-lasting attar crafted for those who appreciate confidence and elegance. Fresh citrus, aromatic florals, soft marine accords, warm amber, smooth musk, and rich cedarwood create a refined fragrance that leaves a lasting impression.",
    "categories": [
      "Fresh",
      "Men",
      "Women"
    ],
    "sizes": [
      {
        "id": 1719,
        "label": "1 ml",
        "price": 69
      },
      {
        "id": 1720,
        "label": "3 ml",
        "price": 99
      },
      {
        "id": 1721,
        "label": "6 ml",
        "price": 149
      }
    ]
  },
  {
    "id": 122,
    "slug": "aqua-mist",
    "wpSlug": "aqua-mist-attar-premium-alcohol-free-perfume-dn-essentia",
    "name": "Aqua Mist",
    "image": "/images/products/aqua-mist.png",
    "gallery": [
      "/images/products/aqua-mist.png",
      "/images/gallery/aqua-mist.png"
    ],
    "character": "Modern • Confident • Sharp",
    "bestFor": "Daily Wear • Evening Outings • Date Nights",
    "notes": {
      "top": [
        "Green Apple",
        "Lemon",
        "Bergamot"
      ],
      "heart": [
        "Jasmine",
        "Lavender",
        "Marine Accord"
      ],
      "base": [
        "Musk",
        "Amber",
        "Cedarwood"
      ]
    },
    "about": "Aqua Mist is a sophisticated and long-lasting attar crafted for those who appreciate confidence and elegance. Fresh citrus, aromatic florals, soft marine accords, warm amber, smooth musk, and rich cedarwood create a refined fragrance that leaves a lasting impression.",
    "categories": [
      "Best Seller",
      "Fresh",
      "Men",
      "Women"
    ],
    "sizes": [
      {
        "id": 1729,
        "label": "1 ml",
        "price": 69
      },
      {
        "id": 1730,
        "label": "3 ml",
        "price": 99
      },
      {
        "id": 1731,
        "label": "6 ml",
        "price": 149
      }
    ]
  },
  {
    "id": 125,
    "slug": "oud-legacy",
    "wpSlug": "best-long-lasting-attar-for-men",
    "name": "Oud Legacy",
    "image": "/images/products/oud-legacy.png",
    "gallery": [
      "/images/products/oud-legacy.png",
      "/images/gallery/oud-legacy.png"
    ],
    "character": "Royal • Bold • Timeless",
    "bestFor": "Evening wear, weddings, festive occasions",
    "notes": {
      "top": [
        "Black Pepper",
        "Bergamot",
        "Saffron"
      ],
      "heart": [
        "Lavender",
        "Geranium",
        "Spicy Accord"
      ],
      "base": [
        "Cedarwood",
        "Amber",
        "Musk"
      ]
    },
    "about": "Oud Legacy is a deep and luxurious attar inspired by the timeless richness of traditional oud fragrances. Blended with smoky woods, warm spicy accords, soft musk, and refined oriental notes, it delivers a bold yet elegant aroma that feels powerful, sophisticated, and unforgettable. Crafted for those who appreciate classic luxury and long-lasting depth, Oud Legacy leaves a royal and commanding impression wherever you go.",
    "categories": [
      "Men",
      "Oud",
      "Woody"
    ],
    "sizes": [
      {
        "id": 1726,
        "label": "1 ml",
        "price": 59
      },
      {
        "id": 1727,
        "label": "3 ml",
        "price": 89
      },
      {
        "id": 1728,
        "label": "6 ml",
        "price": 129
      }
    ]
  },
  {
    "id": 128,
    "slug": "pure-apeal",
    "wpSlug": "pure-appeal-attar-elegant-perfume-oil-dn-essentia",
    "name": "Pure Apeal",
    "image": "/images/products/pure-apeal.png",
    "gallery": [
      "/images/products/pure-apeal.png",
      "/images/gallery/pure-apeal.png"
    ],
    "character": "Modern • Confident • Sharp",
    "bestFor": "Daily Wear • Casual Outings • Events",
    "notes": {
      "top": [
        "Pink Pepper",
        "Bergamot",
        "Green Apple"
      ],
      "heart": [
        "Iris",
        "Lavender",
        "Jasmine"
      ],
      "base": [
        "Musk",
        "Sandalwood",
        "Amber"
      ]
    },
    "about": "Pure Appeal is a refined and refreshing attar crafted to express elegance, confidence, and everyday sophistication. Its smooth blend of delicate florals, soft musk, and gentle woody accords creates a clean and uplifting fragrance that feels both modern and timeless. Light yet long-lasting, Pure Appeal leaves a graceful and memorable impression wherever you go.",
    "categories": [
      "Fresh",
      "Men",
      "Women"
    ],
    "sizes": [
      {
        "id": 1722,
        "label": "1 ml",
        "price": 59
      },
      {
        "id": 1723,
        "label": "3 ml",
        "price": 89
      },
      {
        "id": 1724,
        "label": "6 ml",
        "price": 129
      }
    ]
  }
];

export const combos: SeedCombo[] = [
  {
    "id": 996,
    "slug": "ultimate-collection",
    "wpSlug": "attar-collection-for-men-women",
    "name": "Ultimate Collection",
    "image": "/images/collections/ultimate-collection.png",
    "price": 449,
    "regularPrice": 599,
    "pick": 7,
    "sizeMl": 1,
    "includes": [
      "All 7 Signature DN Essentia Attars",
      "1 ml Each (Concentrated Perfume Oil)",
      "Premium Protective Packaging"
    ],
    "about": "DN Essentia Ultimate Collection brings together all 7 signature alcohol-free attars (1 ml each) in one premium collection. From fresh citrus blends to rich oud, warm musk, and elegant woody fragrances, this complete set lets you experience every scent crafted by DN Essentia. It’s the perfect choice for fragrance lovers who want to explore the entire collection before selecting their favourites in larger sizes.",
    "perfectFor": [
      "Experiencing All 7 Fragrances",
      "Finding Your Signature Scent",
      "First-Time Buyers",
      "Premium Gifting",
      "Exploring the Complete DN Essentia Collection"
    ],
    "howToUse": "Apply a small amount to your pulse points, including the wrists, neck, and behind the ears. Explore a different fragrance each day and discover the scents that best match your personality and every occasion.",
    "whyChoose": [
      "Includes All 7 Signature Fragrances",
      "Alcohol-Free & Skin-Friendly",
      "Long-Lasting Concentrated Attars",
      "Perfect Introduction to DN Essentia",
      "Ideal Before Purchasing Larger Bottles"
    ]
  },
  {
    "id": 995,
    "slug": "luxury-pack",
    "wpSlug": "luxury-attar-for-men-women",
    "name": "Luxury Pack",
    "image": "/images/collections/luxury.png",
    "price": 399,
    "regularPrice": 599,
    "pick": 3,
    "sizeMl": 6,
    "includes": [
      "Choose Any 3 Premium Attars",
      "6 ml Each (Concentrated Perfume Oil)",
      "Premium Protective Packaging"
    ],
    "about": "DN Essentia Luxury Attar Pack is created for those who have already found their favourite fragrances and want to enjoy them for longer. Choose any 3 premium alcohol-free attars (6 ml each) from our exclusive collection and experience rich, long-lasting fragrances crafted for everyday elegance. Whether for work, celebrations, or special occasions, this luxurious collection ensures your signature scents are always within reach.",
    "perfectFor": [
      "Everyday Luxury",
      "Long-Term Fragrance Lovers",
      "Office & Special Occasions",
      "Premium Gifting",
      "Building Your Signature Collection"
    ],
    "howToUse": "Apply a small amount to your pulse points, including the wrists, neck, and behind the ears. The concentrated formula delivers a rich, long-lasting fragrance with just a few drops.",
    "whyChoose": [
      "Choose Any 3 Premium Fragrances",
      "6 ml Premium Bottles",
      "Alcohol-Free & Skin-Friendly",
      "Long-Lasting Luxury Performance",
      "Crafted for Everyday Eleganc"
    ]
  },
  {
    "id": 992,
    "slug": "premium-pack",
    "wpSlug": "premium-pack-for-men",
    "name": "Premium Pack",
    "image": "/images/collections/premium.png",
    "price": 449,
    "regularPrice": 599,
    "pick": 5,
    "sizeMl": 3,
    "includes": [
      "Choose Any 5 Premium Attars",
      "3 ml Each (Concentrated Perfume Oil)",
      "Premium Protective Packaging"
    ],
    "about": "DN Essentia Premium Attar Pack is crafted for fragrance enthusiasts who appreciate variety without compromising on quality. Choose any 5 premium alcohol-free attars (3 ml each) from our exclusive collection and build your own signature fragrance wardrobe. From fresh everyday scents to rich oud and warm musky blends, this collection offers the perfect fragrance for every mood, season, and occasion.",
    "perfectFor": [
      "Building Your Signature Collection",
      "Daily & Occasion Wear",
      "Fragrance Enthusiasts",
      "Premium Gifting",
      "Long-Term Everyday Use"
    ],
    "howToUse": "Apply a small amount to your pulse points, including the wrists, neck, and behind the ears. Since attars are highly concentrated, only a few drops are enough to enjoy a rich and long-lasting fragrance throughout the day.",
    "whyChoose": [
      "Choose Any 5 Premium Fragrances",
      "3 ml Long-Lasting Bottles",
      "Alcohol-Free & Skin-Friendly",
      "Carefully Curated Luxury Collection",
      "Exceptional Value for Everyday Luxury"
    ]
  },
  {
    "id": 991,
    "slug": "explorer-pack",
    "wpSlug": "explorer-attar-pack-choose-any-3-premium-attars-3-ml-dn-essentia",
    "name": "Explorer Pack",
    "image": "/images/collections/explorer.png",
    "price": 279,
    "regularPrice": 399,
    "pick": 3,
    "sizeMl": 3,
    "includes": [
      "Choose Any 3 Premium Attars",
      "3 ml Each (Concentrated Perfume Oil)",
      "Premium Protective Packaging"
    ],
    "about": "DN Essentia Explorer Attar Pack is crafted for those who have discovered the fragrances they love and want to enjoy them for longer. Choose any 3 premium alcohol-free attars (3 ml each) from our exclusive collection and experience luxurious fragrances designed for everyday wear, special occasions, and everything in between. With larger bottles, this pack offers exceptional value while letting you enjoy your favourite scents for longer.",
    "perfectFor": [
      "Daily Fragrance Enthusiasts",
      "Signature Fragrance Collection",
      "Office & Everyday Wear",
      "Premium Gifting",
      "Long-Term Use"
    ],
    "howToUse": "Apply a small amount to your pulse points, including the wrists, neck, and behind the ears. Since attars are highly concentrated, just a few drops provide a rich, long-lasting fragrance that stays with you throughout the day.",
    "whyChoose": [
      "Choose Any 3 Premium Fragrances",
      "3 ml Long-Lasting Bottles",
      "Alcohol-Free & Skin-Friendly",
      "Carefully Curated Luxury Collection",
      "Perfect Balance of Variety & Value"
    ]
  },
  {
    "id": 969,
    "slug": "trial-pack",
    "wpSlug": "trial-pack",
    "name": "Trial Pack",
    "image": "/images/collections/trial.png",
    "price": 299,
    "regularPrice": 399,
    "pick": 5,
    "sizeMl": 1,
    "includes": [
      "Choose Any 5 Premium Attars",
      "1 ml Each (Concentrated Perfume Oil)",
      "Premium Protective Packaging"
    ],
    "about": "DN Essentia Trial Attar Pack is designed for fragrance lovers who want to explore more before selecting their favourite scent. Choose any 5 premium alcohol-free attars (1 ml each) from our exclusive collection and enjoy a wider variety of luxurious fragrances. From refreshing daily scents to rich woody and oud-based fragrances, this pack helps you experience the versatility of DN Essentia while finding the perfect fragrance for every mood and occasion.",
    "perfectFor": [
      "Exploring Multiple Fragrances",
      "Everyday Fragrance Lovers",
      "Finding Your Signature Collection",
      "Travel-Friendly Carry",
      "Premium Gifting"
    ],
    "howToUse": "Select your preferred 5 fragrances and apply a small amount on your pulse points such as the wrists, neck, and behind the ears. Since attars are highly concentrated, only a small application is enough to enjoy a long-lasting fragrance throughout the day.",
    "whyChoose": [
      "Choose Any 5 Premium Fragrances",
      "Alcohol-Free & Skin-Friendly",
      "Long-Lasting Concentrated Attars",
      "Carefully Curated Premium Collection",
      "The Perfect Way to Explore More Fragrances"
    ]
  },
  {
    "id": 962,
    "slug": "discovery-pack",
    "wpSlug": "discovery-pack",
    "name": "Discovery Pack",
    "image": "/images/collections/discovery.png",
    "price": 199,
    "regularPrice": 599,
    "pick": 3,
    "sizeMl": 1,
    "includes": [
      "Choose Any 3 Premium Attars",
      "1 ml Each (Concentrated Perfume Oil)",
      "Premium Protective Packaging"
    ],
    "about": "DN Essentia Discovery Attar Pack is the perfect way to experience our premium fragrance collection before choosing a full-size bottle. Select any 3 alcohol-free attars (1 ml each) from our exclusive range and discover the fragrance that matches your personality. Whether you enjoy fresh, woody, musky, or rich oud notes, this pack lets you explore multiple scents at an affordable price.",
    "perfectFor": [
      "First-Time Buyers",
      "Finding Your Signature Fragrance",
      "Everyday Wear",
      "Travel-Friendly Carry",
      "Premium Gifting"
    ],
    "howToUse": "Choose your favourite 3 fragrances and apply a small amount on your pulse points such as the wrists, neck, and behind the ears. Since attars are highly concentrated, only a small application is enough to enjoy a rich and long-lasting fragrance.",
    "whyChoose": [
      "Choose Any 3 Fragrances",
      "Premium Long-Lasting Performance",
      "Alcohol-Free & Skin-Friendly",
      "Carefully Selected Premium Collection",
      "Perfect Way to Explore Before Buying Full Size"
    ]
  }
];

/**
 * Seeds products, the FREEGIFT coupon, default settings and the first admin.
 * Safe to re-run: existing rows (matched by slug / sku / code / key / email) are left untouched.
 *   npm run db:seed
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { attars, combos } from "../src/db/seed-data";
import { defaultSettings } from "../src/lib/settings-defaults";
import { connect, schema } from "./db";

const BEST_SELLERS = ["musk-velvet", "royal-oud", "urban-man", "the-touch"];
const DEFAULT_STOCK = 100;
const GALLERY: Record<string, string> = { "the-touch": "thw-touch", "royal-oud": "royal-oud-1" };

async function main() {
  const { db, close } = await connect();
  let created = 0;

  for (const [i, a] of attars.entries()) {
    const exists = await db.query.products.findFirst({ where: eq(schema.products.slug, a.slug) });
    if (exists) continue;
    const [res] = await db.insert(schema.products).values({
      slug: a.slug,
      type: "attar",
      name: a.name,
      character: a.character,
      bestFor: a.bestFor,
      about: a.about,
      notes: a.notes,
      categories: a.categories.filter((c) => c !== "Best Seller"),
      images: [`/images/products/${a.slug}.png`, `/images/gallery/${GALLERY[a.slug] ?? a.slug}.png`],
      isBestSeller: BEST_SELLERS.includes(a.slug),
      sortOrder: i,
    });
    await db.insert(schema.productVariants).values(
      a.sizes.map((s, j) => ({
        productId: res.insertId,
        label: s.label,
        sku: `DN-${a.slug.toUpperCase()}-${s.label.replace(/\s/g, "").toUpperCase()}`,
        price: s.price,
        stock: DEFAULT_STOCK,
        weightGrams: 30 + j * 15,
        sortOrder: j,
      })),
    );
    created++;
  }

  for (const [i, c] of combos.entries()) {
    const exists = await db.query.products.findFirst({ where: eq(schema.products.slug, c.slug) });
    if (exists) continue;
    const [res] = await db.insert(schema.products).values({
      slug: c.slug,
      type: "combo",
      name: c.name,
      about: c.about,
      categories: ["Combo"],
      images: [c.image],
      pickCount: c.pick,
      sizeMl: c.sizeMl,
      includes: c.includes,
      perfectFor: c.perfectFor,
      howToUse: c.howToUse,
      whyChoose: c.whyChoose,
      sortOrder: 100 + i,
    });
    await db.insert(schema.productVariants).values({
      productId: res.insertId,
      label: c.pick >= 7 ? `7 × ${c.sizeMl} ml` : `${c.pick} × ${c.sizeMl} ml`,
      sku: `DN-${c.slug.toUpperCase()}`,
      price: c.price,
      compareAtPrice: c.regularPrice,
      stock: DEFAULT_STOCK,
      weightGrams: 150,
    });
    created++;
  }
  console.log(`Products: ${created} created, ${attars.length + combos.length - created} already present`);

  const coupon = await db.query.coupons.findFirst({ where: eq(schema.coupons.code, "FREEGIFT") });
  if (!coupon) {
    await db.insert(schema.coupons).values({
      code: "FREEGIFT",
      description: "Free 1ml attar sample on orders above ₹299",
      type: "free_gift",
      giftSize: "1 ml",
      minOrder: 299,
    });
    console.log("Coupon FREEGIFT created");
  }

  for (const [key, value] of Object.entries(defaultSettings)) {
    const row = await db.query.settings.findFirst({ where: eq(schema.settings.key, key) });
    if (!row) await db.insert(schema.settings).values({ key, value });
  }
  console.log("Default settings ensured");

  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    if (!user) {
      await db.insert(schema.users).values({
        email,
        name: "Store Admin",
        role: "admin",
        passwordHash: await bcrypt.hash(password, 12),
        emailVerifiedAt: new Date(),
      });
      console.log(`Admin created: ${email}`);
    } else if (user.role !== "admin") {
      await db.update(schema.users).set({ role: "admin" }).where(eq(schema.users.id, user.id));
      console.log(`Existing user promoted to admin: ${email}`);
    }
  }

  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

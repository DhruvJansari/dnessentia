import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { coupons, db, products, productVariants } from "@/db";
import type { StoreSettings } from "../settings-defaults";

export type CartLineInput = { variantId: number; qty: number; selections?: string[] };

export type PricedLine = {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  variantLabel: string;
  sku: string;
  image: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  weightGrams: number;
  selections: string[] | null;
};

export type Quote = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  total: number;
  coupon: { id: number; code: string; type: string; description: string } | null;
  couponError: string | null;
  giftNote: string | null;
  errors: string[];
};

const MAX_QTY = 20;

/**
 * Prices a cart from the database. The browser's prices are never trusted: every line is re-read here,
 * checked against stock and (for combo packs) the customer's attar picks.
 */
export async function quoteCart(
  input: CartLineInput[],
  options: { couponCode?: string | null; paymentMethod: "razorpay" | "cod"; settings: StoreSettings },
): Promise<Quote> {
  const errors: string[] = [];
  const ids = [...new Set(input.map((l) => l.variantId))].filter((n) => Number.isInteger(n) && n > 0);
  const rows = ids.length
    ? await db
        .select({ variant: productVariants, product: products })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(inArray(productVariants.id, ids))
    : [];
  const byId = new Map(rows.map((r) => [r.variant.id, r]));

  const attarNames = new Set(
    (
      await db
        .select({ name: products.name })
        .from(products)
        .where(and(eq(products.type, "attar"), eq(products.isActive, true)))
    ).map((r) => r.name),
  );

  const lines: PricedLine[] = [];
  const qtyByVariant = new Map<number, number>();
  for (const raw of input) {
    const row = byId.get(raw.variantId);
    if (!row || !row.variant.isActive || !row.product.isActive) {
      errors.push("An item in your bag is no longer available. Please remove it and try again.");
      continue;
    }
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(raw.qty)));
    let selections: string[] | null = null;
    if (row.product.type === "combo") {
      const pick = row.product.pickCount ?? 7;
      selections = [...new Set(raw.selections ?? [])].filter((n) => attarNames.has(n)).sort();
      if (pick < 7 && selections.length !== pick) {
        errors.push(`Please choose ${pick} attars for ${row.product.name}.`);
        continue;
      }
      if (pick >= 7) selections = [...attarNames].sort();
    }
    qtyByVariant.set(row.variant.id, (qtyByVariant.get(row.variant.id) ?? 0) + qty);
    lines.push({
      variantId: row.variant.id,
      productId: row.product.id,
      slug: row.product.slug,
      name: row.product.name,
      variantLabel: row.variant.label,
      sku: row.variant.sku,
      image: row.product.images[0] ?? "",
      unitPrice: row.variant.price,
      quantity: qty,
      lineTotal: row.variant.price * qty,
      weightGrams: row.variant.weightGrams,
      selections,
    });
  }

  for (const [variantId, qty] of qtyByVariant) {
    const row = byId.get(variantId)!;
    if (row.variant.stock < qty) {
      errors.push(
        row.variant.stock <= 0
          ? `${row.product.name} (${row.variant.label}) is sold out.`
          : `Only ${row.variant.stock} left of ${row.product.name} (${row.variant.label}).`,
      );
    }
  }

  if (lines.length === 0 && errors.length === 0) errors.push("Your bag is empty.");

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);

  let discount = 0;
  let giftNote: string | null = null;
  let coupon: Quote["coupon"] = null;
  let couponError: string | null = null;
  const code = options.couponCode?.trim().toUpperCase();
  if (code) {
    const c = await db.query.coupons.findFirst({ where: eq(coupons.code, code) });
    const now = new Date();
    if (!c || !c.isActive) couponError = "This coupon code is not valid.";
    else if (c.startsAt && c.startsAt > now) couponError = "This coupon is not active yet.";
    else if (c.endsAt && c.endsAt < now) couponError = "This coupon has expired.";
    else if (c.maxUses != null && c.usedCount >= c.maxUses) couponError = "This coupon has reached its usage limit.";
    else if (subtotal < c.minOrder) couponError = `Add ₹${c.minOrder - subtotal} more to use ${c.code}.`;
    else {
      coupon = { id: c.id, code: c.code, type: c.type, description: c.description };
      if (c.type === "percent") discount = Math.round((subtotal * Math.min(c.value, 100)) / 100);
      else if (c.type === "fixed") discount = Math.min(c.value, subtotal);
      else giftNote = c.description || "Free gift included";
    }
  }

  const { freeShippingThreshold, flatFee } = options.settings.shipping;
  const shippingFee = lines.length === 0 || subtotal >= freeShippingThreshold ? 0 : flatFee;
  const codFee = options.paymentMethod === "cod" ? options.settings.payments.codFee : 0;
  const total = Math.max(0, subtotal - discount + shippingFee + codFee);

  return { lines, subtotal, discount, shippingFee, codFee, total, coupon, couponError, giftNote, errors };
}

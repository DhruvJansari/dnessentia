import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { coupons, db, products, productVariants } from "@/db";
import { env, integrations } from "../env";
import type { StoreSettings } from "../settings-defaults";
import { checkServiceability, parcelWeightKg } from "../shiprocket";

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
  isGift: boolean;
};

export type GiftOption = { variantId: number; name: string; label: string };

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
  /** free_gift coupons: the samples the customer can choose from, and the chosen one. */
  giftOptions: GiftOption[];
  giftVariantId: number | null;
  errors: string[];
  /** Where shippingFee came from, and the courier it was quoted for. */
  shipping: { source: ShippingSource; courierName: string | null; etd: string | null };
};

export type ShippingSource = "free" | "courier" | "flat";

const MAX_QTY = 20;

/**
 * Prices a cart from the database. The browser's prices are never trusted: every line is re-read here,
 * checked against stock and (for combo packs) the customer's attar picks.
 */
export async function quoteCart(
  input: CartLineInput[],
  options: {
    couponCode?: string | null;
    giftVariantId?: number | null;
    paymentMethod: "razorpay" | "cod";
    settings: StoreSettings;
    /** The delivery PIN code, when known, for a live courier rate. */
    deliveryPincode?: string | null;
  },
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
      isGift: false,
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

  // A free_gift coupon with a size adds a ₹0 line for the sample the customer picks.
  let giftOptions: GiftOption[] = [];
  let giftVariantId: number | null = null;
  if (coupon?.type === "free_gift") {
    const c = await db.query.coupons.findFirst({ where: eq(coupons.id, coupon.id), columns: { giftSize: true } });
    if (c?.giftSize) {
      const rows = await db
        .select({ variant: productVariants, product: products })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(and(eq(productVariants.label, c.giftSize), eq(productVariants.isActive, true), eq(products.isActive, true), eq(products.type, "attar")));
      const inStock = rows.filter((r) => r.variant.stock - (qtyByVariant.get(r.variant.id) ?? 0) > 0);
      giftOptions = inStock.map((r) => ({ variantId: r.variant.id, name: r.product.name, label: r.variant.label }));
      const chosen = inStock.find((r) => r.variant.id === options.giftVariantId) ?? inStock[0];
      if (chosen) {
        giftVariantId = chosen.variant.id;
        lines.push({
          variantId: chosen.variant.id,
          productId: chosen.product.id,
          slug: chosen.product.slug,
          name: chosen.product.name,
          variantLabel: `${chosen.variant.label} sample`,
          sku: chosen.variant.sku,
          image: chosen.product.images[0] ?? "",
          unitPrice: 0,
          quantity: 1,
          lineTotal: 0,
          weightGrams: chosen.variant.weightGrams,
          selections: null,
          isGift: true,
        });
        giftNote = `Free ${chosen.variant.label} ${chosen.product.name} sample`;
      }
    }
  }

  const shipping = await shippingQuote(lines, subtotal, options);
  const shippingFee = shipping.fee;
  const codFee = options.paymentMethod === "cod" ? options.settings.payments.codFee : 0;
  const total = Math.max(0, subtotal - discount + shippingFee + codFee);

  return {
    lines, subtotal, discount, shippingFee, codFee, total, coupon, couponError, giftNote, giftOptions, giftVariantId, errors,
    shipping: { source: shipping.source, courierName: shipping.courierName, etd: shipping.etd },
  };
}

/**
 * Shipping fee below the free-shipping threshold: the Shiprocket freight rate of the store's chosen courier for
 * this PIN code and parcel weight, rounded up to the rupee. Falls back to the flat fee without a PIN code, when
 * Shiprocket isn't configured, or when it can't be reached.
 */
async function shippingQuote(
  lines: PricedLine[],
  subtotal: number,
  options: { paymentMethod: "razorpay" | "cod"; settings: StoreSettings; deliveryPincode?: string | null },
): Promise<{ fee: number; source: ShippingSource; courierName: string | null; etd: string | null }> {
  const { freeShippingThreshold, flatFee, rateSource, courierChoice } = options.settings.shipping;
  if (lines.length === 0 || subtotal >= freeShippingThreshold) return { fee: 0, source: "free", courierName: null, etd: null };
  const flat = { fee: flatFee, source: "flat" as const, courierName: null, etd: null };
  const pin = options.deliveryPincode?.trim() ?? "";
  if (rateSource !== "courier" || !/^[1-9]\d{5}$/.test(pin) || !integrations.shiprocket() || !env.shiprocket.pickupPincode) return flat;
  try {
    const grams = lines.reduce((n, l) => n + l.weightGrams * l.quantity, 0);
    const s = await checkServiceability(pin, { weightKg: parcelWeightKg(grams), cod: options.paymentMethod === "cod", choice: courierChoice });
    if (!s.courier) return flat;
    return { fee: Math.ceil(s.courier.rate), source: "courier", courierName: s.courier.name, etd: s.courier.etd };
  } catch (err) {
    console.error("[pricing] courier rate lookup failed, using flat fee", err);
    return flat;
  }
}

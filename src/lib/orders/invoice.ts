import "server-only";
import { eq, sql } from "drizzle-orm";
import { counters, db, orders } from "@/db";
import type { StoreSettings } from "../settings-defaults";

/** Indian financial year label for a date, e.g. 2026-27 (April to March, IST). */
function financialYear(date: Date) {
  const ist = new Date(date.getTime() + 5.5 * 3600e3);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/**
 * Gives an order its invoice number once, when it's confirmed. Numbers are sequential per financial year
 * (DN/2026-27/0001) with no gaps, using a locked counter row.
 */
export async function assignInvoiceNumber(orderId: number, prefix: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId), columns: { invoiceNumber: true, kind: true, createdAt: true } });
  if (!order || order.invoiceNumber || order.kind !== "standard") return order?.invoiceNumber ?? null;
  const fy = financialYear(order.createdAt);
  const key = `invoice:${fy}`;
  return db.transaction(async (tx) => {
    await tx.insert(counters).values({ key, value: 0 }).onDuplicateKeyUpdate({ set: { key } });
    const [row] = await tx.select().from(counters).where(eq(counters.key, key)).for("update");
    const next = row.value + 1;
    await tx.update(counters).set({ value: next }).where(eq(counters.key, key));
    const invoiceNumber = `${prefix}/${fy}/${String(next).padStart(4, "0")}`;
    await tx
      .update(orders)
      .set({ invoiceNumber, invoicedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(orders.id, orderId));
    return invoiceNumber;
  });
}

export type TaxLine = { description: string; hsn: string; qty: number; taxable: number; tax: number; total: number };

/**
 * Splits GST out of tax-inclusive prices. Same state as the business → CGST + SGST, otherwise IGST.
 * Shipping and COD fees are taxed at the same rate; discounts reduce the taxable value proportionally.
 */
export function invoiceTaxes(
  order: { subtotal: number; discount: number; shippingFee: number; codFee: number; shipState: string },
  items: { name: string; variantLabel: string; quantity: number; lineTotal: number; isGift: boolean }[],
  business: StoreSettings["business"],
) {
  const rate = business.gstRate / 100;
  const split = (gross: number) => {
    const taxable = Math.round((gross / (1 + rate)) * 100) / 100;
    return { taxable, tax: Math.round((gross - taxable) * 100) / 100 };
  };
  const discountRatio = order.subtotal > 0 ? (order.subtotal - order.discount) / order.subtotal : 1;
  const lines: TaxLine[] = items.map((i) => {
    const gross = Math.round(i.lineTotal * discountRatio * 100) / 100;
    const { taxable, tax } = split(gross);
    return { description: `${i.name} (${i.variantLabel})${i.isGift ? ", free gift" : ""}`, hsn: business.hsn, qty: i.quantity, taxable, tax, total: gross };
  });
  for (const [label, amount] of [
    ["Shipping charges", order.shippingFee],
    ["COD charges", order.codFee],
  ] as const) {
    if (amount > 0) {
      const { taxable, tax } = split(amount);
      lines.push({ description: label, hsn: "9965", qty: 1, taxable, tax, total: amount });
    }
  }
  const taxable = lines.reduce((n, l) => n + l.taxable, 0);
  const tax = lines.reduce((n, l) => n + l.tax, 0);
  const intraState = order.shipState.trim().toLowerCase() === business.state.trim().toLowerCase();
  return {
    lines,
    taxable: Math.round(taxable * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    intraState,
    cgst: intraState ? Math.round((tax / 2) * 100) / 100 : 0,
    sgst: intraState ? Math.round((tax / 2) * 100) / 100 : 0,
    igst: intraState ? 0 : Math.round(tax * 100) / 100,
    rate: business.gstRate,
  };
}

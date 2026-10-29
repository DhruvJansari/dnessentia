import { and, asc, gte, lt, type SQL } from "drizzle-orm";
import { db, orders } from "@/db";
import { csvResponse, dateRange, toCsv } from "@/lib/admin/csv";
import { audit } from "@/lib/audit";
import { requireStaff } from "@/lib/auth/session";
import { invoiceTaxes } from "@/lib/orders/invoice";
import { getSettings } from "@/lib/settings";

const ist = (d: Date | null) => (d ? new Date(d.getTime() + 5.5 * 3600e3).toISOString().replace("T", " ").slice(0, 16) : "");

/** Orders with GST split, one row per order. /admin/export/orders?from=2026-04-01&to=2026-04-30 */
export async function GET(request: Request) {
  const actor = await requireStaff();
  const range = dateRange(new URL(request.url));
  const where: SQL[] = [];
  if (range.from) where.push(gte(orders.createdAt, range.from));
  if (range.to) where.push(lt(orders.createdAt, range.to));
  const [rows, { business }] = await Promise.all([
    db.query.orders.findMany({ where: where.length ? and(...where) : undefined, orderBy: asc(orders.createdAt), with: { items: true } }),
    getSettings(),
  ]);

  const body = toCsv(
    [
      "Order no", "Placed (IST)", "Invoice no", "Type", "Status", "Payment method", "Payment status",
      "Customer", "Email", "Phone", "Address", "City", "State", "PIN",
      "Items", "Subtotal", "Discount", "Coupon", "Shipping", "COD fee", "Total",
      "Taxable value", "CGST", "SGST", "IGST", "Refunded", "Cancellation charge",
      "Razorpay payment id", "AWB", "Courier", "Delivered (IST)",
    ],
    rows.map((o) => {
      const t = invoiceTaxes(o, o.items, business);
      return [
        o.orderNumber, ist(o.createdAt), o.invoiceNumber, o.kind, o.status, o.paymentMethod, o.paymentStatus,
        o.customerName, o.email, o.phone, [o.shipLine1, o.shipLine2].filter(Boolean).join(", "), o.shipCity, o.shipState, o.shipPincode,
        o.items.map((i) => `${i.name} ${i.variantLabel} x${i.quantity}${i.isGift ? " (gift)" : ""}`).join("; "),
        o.subtotal, o.discount, o.couponCode, o.shippingFee, o.codFee, o.total,
        t.taxable, t.cgst, t.sgst, t.igst, o.refundedAmount, o.cancellationCharge,
        o.razorpayPaymentId, o.awbCode, o.courierName, ist(o.deliveredAt),
      ];
    }),
  );
  await audit({ actor, action: "export.orders", entityType: "export", summary: `Exported ${rows.length} orders (${range.label})` });
  return csvResponse(`dn-orders_${range.label}.csv`, body);
}

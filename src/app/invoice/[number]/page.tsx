import type { Metadata } from "next";
import { Suspense } from "react";
import { PrintButton } from "@/components/orders/print-button";
import { getSessionUser, isStaff } from "@/lib/auth/session";
import { isValidOrderKey } from "@/lib/orders/access";
import { invoiceTaxes } from "@/lib/orders/invoice";
import { getSettings } from "@/lib/settings";
import { db, orders } from "@/db";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default function InvoicePage({ params, searchParams }: PageProps<"/invoice/[number]">) {
  return (
    <div className="min-h-svh bg-stone-100 py-8 print:bg-white print:py-0">
      <Suspense fallback={<p className="p-8 text-center text-sm text-stone-500">Loading invoice…</p>}>
        <Invoice params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

async function Invoice({ params, searchParams }: Pick<PageProps<"/invoice/[number]">, "params" | "searchParams">) {
  const [{ number }, sp] = await Promise.all([params, searchParams]);
  const order = await db.query.orders.findFirst({ where: eq(orders.orderNumber, number.toUpperCase()), with: { items: true } });
  const user = await getSessionUser();
  const allowed = order && (isValidOrderKey(order.orderNumber, typeof sp.key === "string" ? sp.key : null) || (user && (user.id === order.userId || isStaff(user))));
  if (!order || !allowed) return <p className="p-8 text-center text-sm">Invoice not found.</p>;
  if (!order.invoiceNumber) return <p className="p-8 text-center text-sm">An invoice is issued once the order is confirmed.</p>;

  const { business, store } = await getSettings();
  const t = invoiceTaxes(order, order.items, business);
  const address = [business.addressLine1, business.addressLine2, [business.city, business.state, business.pincode].filter(Boolean).join(", ")].filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl bg-white p-6 text-[13px] leading-relaxed text-stone-800 shadow-sm sm:p-10 print:max-w-none print:p-0 print:shadow-none">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex flex-col justify-between gap-6 border-b border-stone-200 pb-6 sm:flex-row">
        <div>
          <p className="font-serif text-3xl leading-none">DN</p>
          <p className="text-[9px] tracking-[0.4em]">ESSENTIA</p>
          <p className="mt-4 font-semibold">{business.legalName}</p>
          {address.map((l) => (
            <p key={l}>{l}</p>
          ))}
          <p>GSTIN: {business.gstin || "Not registered"}</p>
          <p>
            {store.supportEmail} · {store.supportPhone}
          </p>
        </div>
        <div className="sm:text-right">
          <h1 className="font-sans text-xl font-semibold uppercase tracking-[0.04em]">{business.gstin ? "Tax invoice" : "Invoice"}</h1>
          <dl className="mt-3 space-y-0.5">
            <div><dt className="inline text-stone-500">Invoice no: </dt><dd className="inline font-medium">{order.invoiceNumber}</dd></div>
            <div><dt className="inline text-stone-500">Invoice date: </dt><dd className="inline">{dateFmt.format(order.invoicedAt ?? order.createdAt)}</dd></div>
            <div><dt className="inline text-stone-500">Order no: </dt><dd className="inline">{order.orderNumber}</dd></div>
            <div><dt className="inline text-stone-500">Place of supply: </dt><dd className="inline">{order.shipState}</dd></div>
            <div><dt className="inline text-stone-500">Payment: </dt><dd className="inline">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)"}</dd></div>
          </dl>
        </div>
      </header>

      <section className="grid gap-6 border-b border-stone-200 py-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-stone-500">Bill to / Ship to</p>
          <p className="mt-1 font-medium">{order.customerName}</p>
          <p>
            {order.shipLine1}
            {order.shipLine2 ? `, ${order.shipLine2}` : ""}
          </p>
          <p>
            {order.shipCity}, {order.shipState} {order.shipPincode}
          </p>
          <p>
            {order.phone} · {order.email}
          </p>
        </div>
      </section>

      <table className="mt-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-stone-300 text-[11px] uppercase tracking-[0.04em] text-stone-500">
            <th className="py-2 pr-2 font-semibold">Item</th>
            <th className="py-2 pr-2 font-semibold">HSN/SAC</th>
            <th className="py-2 pr-2 text-right font-semibold">Qty</th>
            <th className="py-2 pr-2 text-right font-semibold">Taxable</th>
            <th className="py-2 pr-2 text-right font-semibold">GST {t.rate}%</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {t.lines.map((l, i) => (
            <tr key={i} className="border-b border-stone-100 align-top">
              <td className="py-2 pr-2">{l.description}</td>
              <td className="py-2 pr-2">{l.hsn}</td>
              <td className="py-2 pr-2 text-right">{l.qty}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{money(l.taxable)}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{money(l.tax)}</td>
              <td className="py-2 text-right tabular-nums">{money(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1">
        <div className="flex justify-between"><dt className="text-stone-500">Taxable value</dt><dd className="tabular-nums">{money(t.taxable)}</dd></div>
        {t.intraState ? (
          <>
            <div className="flex justify-between"><dt className="text-stone-500">CGST {t.rate / 2}%</dt><dd className="tabular-nums">{money(t.cgst)}</dd></div>
            <div className="flex justify-between"><dt className="text-stone-500">SGST {t.rate / 2}%</dt><dd className="tabular-nums">{money(t.sgst)}</dd></div>
          </>
        ) : (
          <div className="flex justify-between"><dt className="text-stone-500">IGST {t.rate}%</dt><dd className="tabular-nums">{money(t.igst)}</dd></div>
        )}
        {order.discount > 0 && (
          <div className="flex justify-between text-stone-500"><dt>Discount applied ({order.couponCode})</dt><dd className="tabular-nums">− {money(order.discount)}</dd></div>
        )}
        <div className="flex justify-between border-t border-stone-300 pt-2 text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
        {order.refundedAmount > 0 && (
          <div className="flex justify-between text-stone-500"><dt>Refunded</dt><dd className="tabular-nums">− {money(order.refundedAmount)}</dd></div>
        )}
      </dl>

      <footer className="mt-10 border-t border-stone-200 pt-4 text-[11px] text-stone-500">
        <p>Prices are inclusive of GST. This is a computer-generated invoice and does not require a signature.</p>
      </footer>
    </article>
  );
}

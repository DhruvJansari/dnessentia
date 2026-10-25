import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { addresses, db } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { deleteAddressAction, setDefaultAddressAction } from "../actions";
import { AddressForm } from "./address-form";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default function AddressesPage() {
  return (
    <div>
      <p className="eyebrow">Addresses</p>
      <h1 className="mt-3 text-5xl">Saved addresses</h1>
      <p className="mt-2 text-ink-soft">Your default address is pre-filled at checkout.</p>
      <Suspense fallback={<div className="mt-8 h-64 animate-pulse bg-cream" />}>
        <AddressList />
      </Suspense>
    </div>
  );
}

async function AddressList() {
  const user = await requireUser("/account/addresses");
  const rows = await db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, user.id))
    .orderBy(desc(addresses.isDefault), desc(addresses.updatedAt));

  return (
    <div className="mt-8 space-y-8">
      {rows.length > 0 && (
        <ul className="reveal-stagger grid gap-4 sm:grid-cols-2">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-col border border-line bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{a.name}</p>
                {a.isDefault && <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-medium text-gold">Default</span>}
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <details className="group w-full">
                  <summary className="cursor-pointer list-none text-ink underline underline-offset-4 [&::-webkit-details-marker]:hidden">
                    Edit
                  </summary>
                  <div className="mt-4">
                    <AddressForm address={a} />
                  </div>
                </details>
                {!a.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-muted underline underline-offset-4 hover:text-ink">Make default</button>
                  </form>
                )}
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-red-700 underline underline-offset-4">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="border border-line bg-cream p-5 sm:p-8">
        <h2 className="text-3xl">Add a new address</h2>
        <div className="mt-6">
          <AddressForm />
        </div>
      </div>
    </div>
  );
}

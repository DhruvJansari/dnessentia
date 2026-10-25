import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Breadcrumbs } from "@/components/page-header";
import { addresses, db } from "@/db";
import { getSessionUser } from "@/lib/auth/session";
import { integrations } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="container-x pb-20 pt-8 md:pb-28">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/cart", label: "Bag" }, { label: "Checkout" }]} />
      <h1 className="mt-6 text-5xl sm:text-6xl">Checkout</h1>
      <div className="mt-10">
        <Suspense fallback={<CheckoutSkeleton />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </section>
  );
}

async function CheckoutContent() {
  const [user, settings] = await Promise.all([getSessionUser(), getSettings()]);
  const saved = user
    ? await db.select().from(addresses).where(eq(addresses.userId, user.id)).orderBy(desc(addresses.isDefault), desc(addresses.updatedAt))
    : [];
  return (
    <CheckoutForm
      user={user ? { email: user.email, name: user.name, phone: user.phone } : null}
      savedAddresses={saved.map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        isDefault: a.isDefault,
      }))}
      codEnabled={settings.payments.codEnabled}
      codFee={settings.payments.codFee}
      razorpayReady={settings.payments.razorpayEnabled && integrations.razorpay()}
      razorpayTestMode={integrations.razorpayTestMode()}
    />
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16" aria-busy="true">
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4 border-b border-line pb-10">
            <div className="h-8 w-56 animate-pulse bg-sand" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-12 animate-pulse bg-sand/70" />
              <div className="h-12 animate-pulse bg-sand/70" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-96 animate-pulse bg-cream" />
    </div>
  );
}

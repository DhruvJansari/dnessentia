import { inArray } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { CopyField, SettingsForm, TestButton } from "@/components/admin/settings-forms";
import { Card, PageTitle, Skeleton } from "@/components/admin/ui";
import { db, users } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { env, integrations } from "@/lib/env";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageTitle title="Settings" description="Store rules, integrations and team access. Every change is recorded under Activity." />
      <Suspense fallback={<Skeleton rows={3} />}>
        <Settings />
      </Suspense>
    </>
  );
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${ok ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

async function Settings() {
  await requireAdmin();
  const [s, team] = await Promise.all([
    getSettings(),
    db.select({ id: users.id, email: users.email, name: users.name, role: users.role }).from(users).where(inArray(users.role, ["admin", "staff"])),
  ]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Card title="Shipping">
          <SettingsForm
            section="shipping"
            fields={[
              { name: "freeShippingThreshold", label: "Free shipping above", type: "number", value: s.shipping.freeShippingThreshold, suffix: "₹" },
              { name: "flatFee", label: "Shipping fee below that", type: "number", value: s.shipping.flatFee, suffix: "₹" },
            ]}
          />
        </Card>
        <Card title="Payments">
          <SettingsForm
            section="payments"
            fields={[
              { name: "razorpayEnabled", label: "Online payments (Razorpay)", type: "checkbox", value: s.payments.razorpayEnabled, hint: "Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
              { name: "codEnabled", label: "Cash on Delivery", type: "checkbox", value: s.payments.codEnabled, hint: "Off on the current website. Turn on to offer COD at checkout." },
              { name: "codFee", label: "COD fee", type: "number", value: s.payments.codFee, suffix: "₹" },
            ]}
          />
        </Card>
        <Card title="Fulfilment">
          <SettingsForm
            section="fulfilment"
            fields={[
              { name: "autoCreateShipment", label: "Create Shiprocket shipments automatically", type: "checkbox", value: s.fulfilment.autoCreateShipment, hint: "When on, paid/COD orders go to Shiprocket and get an AWB without a click." },
              { name: "packageLengthCm", label: "Default box length", type: "number", value: s.fulfilment.packageLengthCm, suffix: "cm" },
              { name: "packageBreadthCm", label: "Default box breadth", type: "number", value: s.fulfilment.packageBreadthCm, suffix: "cm" },
              { name: "packageHeightCm", label: "Default box height", type: "number", value: s.fulfilment.packageHeightCm, suffix: "cm" },
            ]}
          />
        </Card>
        <Card title="Store">
          <SettingsForm
            section="store"
            fields={[
              { name: "name", label: "Store name", type: "text", value: s.store.name },
              { name: "supportEmail", label: "Support email", type: "email", value: s.store.supportEmail },
              { name: "supportPhone", label: "Support phone", type: "text", value: s.store.supportPhone },
              { name: "lowStockThreshold", label: "Low stock alert at", type: "number", value: s.store.lowStockThreshold, suffix: "units" },
            ]}
          />
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Integrations">
          <div className="space-y-6 text-sm">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Razorpay</p>
                <Status ok={integrations.razorpay()} label={integrations.razorpay() ? (integrations.razorpayTestMode() ? "Test mode" : "Live") : "Not configured"} />
              </div>
              <p className="mt-1 text-stone-500">Webhook URL (events: payment.captured, payment.failed, order.paid):</p>
              <div className="mt-2">
                <CopyField value={`${env.appUrl}/api/webhooks/razorpay`} />
              </div>
              <p className="mt-1 text-[12px] text-stone-500">
                Webhook secret {env.razorpay.webhookSecret ? "is set" : "is missing (RAZORPAY_WEBHOOK_SECRET)"}.
              </p>
            </div>
            <div className="border-t border-stone-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Shiprocket</p>
                <Status ok={integrations.shiprocket()} label={integrations.shiprocket() ? `Pickup: ${env.shiprocket.pickupLocation}` : "Not configured"} />
              </div>
              <p className="mt-1 text-stone-500">Tracking webhook URL (Settings → API → Webhooks):</p>
              <div className="mt-2">
                <CopyField value={`${env.appUrl}/api/webhooks/shipping-updates`} />
              </div>
              <p className="mt-1 text-[12px] text-stone-500">Security token {env.shiprocket.webhookToken ? "is set" : "is missing (SHIPROCKET_WEBHOOK_TOKEN)"}.</p>
              {integrations.shiprocket() && (
                <div className="mt-3">
                  <TestButton kind="shiprocket" />
                </div>
              )}
            </div>
            <div className="border-t border-stone-100 pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">SMTP email</p>
                <Status ok={integrations.smtp()} label={integrations.smtp() ? env.smtp.host : "Not configured"} />
              </div>
              <p className="mt-1 text-stone-500">Sends from {env.smtp.from}.</p>
              <div className="mt-3">
                <TestButton kind="email" />
              </div>
            </div>
          </div>
        </Card>

        <Card title="Notifications">
          <SettingsForm
            section="notifications"
            fields={[
              { name: "adminEmail", label: "Send new-order alerts to", type: "email", value: s.notifications.adminEmail },
              { name: "notifyOnNewOrder", label: "Email me for every new order", type: "checkbox", value: s.notifications.notifyOnNewOrder },
            ]}
          />
        </Card>

        <Card title="Team">
          <ul className="divide-y divide-stone-100 text-sm">
            {team.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2.5">
                <Link href={`/admin/customers/${t.id}`} className="hover:underline">
                  {t.name || t.email} <span className="text-stone-500">{t.email}</span>
                </Link>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[12px] capitalize">{t.role}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] text-stone-500">
            To add someone, ask them to create an account, then open their profile under Customers and change the role. Staff can manage orders and products; admins can also change settings, coupons and roles.
          </p>
        </Card>
      </div>
    </div>
  );
}

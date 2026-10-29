import { inArray } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { CopyField, MaintenanceButton, SettingsForm, TestButton } from "@/components/admin/settings-forms";
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
              {
                name: "rateSource",
                label: "Shipping fee below that",
                type: "select",
                value: s.shipping.rateSource,
                options: [
                  { value: "courier", label: "Live courier rate from Shiprocket" },
                  { value: "flat", label: "Flat fee" },
                ],
                hint: "Live rates depend on the customer's PIN code and parcel weight.",
              },
              { name: "flatFee", label: "Flat fee", type: "number", value: s.shipping.flatFee, suffix: "₹", hint: "Also used when Shiprocket can't quote a rate." },
              {
                name: "courierChoice",
                label: "Courier to quote and book",
                type: "select",
                value: s.shipping.courierChoice,
                options: [
                  { value: "cheapest", label: "Cheapest courier" },
                  { value: "fastest", label: "Fastest courier" },
                  { value: "recommended", label: "Shiprocket's recommendation" },
                ],
                hint: "Create shipment books this same courier, so what customers pay matches your Shiprocket charge.",
              },
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
        <Card title="Business details (invoices & Contact page)">
          <SettingsForm
            section="business"
            fields={[
              { name: "legalName", label: "Legal / trade name", type: "text", value: s.business.legalName },
              { name: "gstin", label: "GSTIN", type: "text", value: s.business.gstin, hint: "Leave empty if not GST-registered; invoices then show \"Invoice\" instead of \"Tax invoice\"." },
              { name: "addressLine1", label: "Address line 1", type: "text", value: s.business.addressLine1 },
              { name: "addressLine2", label: "Address line 2", type: "text", value: s.business.addressLine2 },
              { name: "city", label: "City", type: "text", value: s.business.city },
              { name: "state", label: "State", type: "text", value: s.business.state, hint: "Orders to this state get CGST + SGST; others get IGST." },
              { name: "pincode", label: "PIN code", type: "text", value: s.business.pincode },
              { name: "hsn", label: "HSN code for attars", type: "text", value: s.business.hsn },
              { name: "gstRate", label: "GST rate", type: "number", value: s.business.gstRate, suffix: "%" },
              { name: "invoicePrefix", label: "Invoice number prefix", type: "text", value: s.business.invoicePrefix, hint: "Invoices look like DN/2026-27/0001." },
            ]}
          />
        </Card>
        <Card title="Policies">
          <SettingsForm
            section="policies"
            fields={[
              { name: "cancellationWindowHours", label: "Customers can cancel within", type: "number", value: s.policies.cancellationWindowHours, suffix: "hours" },
              { name: "cancellationChargePercent", label: "Cancellation charge on prepaid orders", type: "number", value: s.policies.cancellationChargePercent, suffix: "%" },
              { name: "replacementWindowDays", label: "Replacement requests allowed for", type: "number", value: s.policies.replacementWindowDays, suffix: "days" },
              { name: "paymentReminderAfterHours", label: "Send unpaid-order reminder after", type: "number", value: s.policies.paymentReminderAfterHours, suffix: "hours" },
              { name: "pendingPaymentExpiryHours", label: "Cancel unpaid online orders after", type: "number", value: s.policies.pendingPaymentExpiryHours, suffix: "hours" },
            ]}
          />
          <div className="mt-5 border-t border-stone-100 pt-4 text-sm">
            <p className="font-medium">Reminders & expiry job</p>
            <p className="mt-1 text-stone-500">Runs automatically when your server calls the cron URL every 15 minutes (see README). You can also run it now.</p>
            <div className="mt-3">
              <MaintenanceButton />
            </div>
          </div>
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
              <p className="mt-1 text-stone-500">
                Webhook URL, optional (events: payment.captured, payment.failed, order.paid). Without it, paid orders are still
                confirmed: the store checks Razorpay every 15 minutes.
              </p>
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
              <p className="mt-1 text-stone-500">
                Tracking webhook URL, optional (Settings → API → Webhooks). Without it, courier status is pulled every 15 minutes.
              </p>
              {env.shiprocket.testOnly && (
                <p className="mt-2 text-[12px] text-amber-700">Test-only mode is on (SHIPROCKET_TEST_ONLY): no courier or pickup is booked.</p>
              )}
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

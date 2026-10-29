"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, diff } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { sendMail, verifySmtp } from "@/lib/mail/send";
import { testEmailTemplate } from "@/lib/mail/templates";
import { getSettings, saveSetting } from "@/lib/settings";
import type { StoreSettings } from "@/lib/settings-defaults";
import { runMaintenance } from "@/lib/orders/maintenance";
import { testShiprocket } from "@/lib/shiprocket";
import { emailField, fieldErrors, type FormState } from "@/lib/validation";

const bool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const int = (min = 0) => z.coerce.number().int().min(min);

const schemas = {
  shipping: z.object({
    freeShippingThreshold: int(),
    flatFee: int(),
    rateSource: z.enum(["courier", "flat"]),
    courierChoice: z.enum(["cheapest", "fastest", "recommended"]),
  }),
  payments: z.object({ razorpayEnabled: bool, codEnabled: bool, codFee: int() }),
  fulfilment: z.object({ autoCreateShipment: bool, packageLengthCm: int(1), packageBreadthCm: int(1), packageHeightCm: int(1) }),
  notifications: z.object({ adminEmail: emailField, notifyOnNewOrder: bool }),
  business: z.object({
    legalName: z.string().trim().min(2).max(120),
    gstin: z.union([z.literal(""), z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid 15-character GSTIN")]),
    addressLine1: z.string().trim().max(200),
    addressLine2: z.string().trim().max(200),
    city: z.string().trim().max(80),
    state: z.string().trim().max(80),
    pincode: z.union([z.literal(""), z.string().trim().regex(/^\d{6}$/, "6-digit PIN")]),
    hsn: z.string().trim().max(10),
    gstRate: z.coerce.number().min(0).max(28),
    invoicePrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{1,10}$/, "Letters/numbers, up to 10"),
  }),
  policies: z.object({
    cancellationWindowHours: int(),
    cancellationChargePercent: z.coerce.number().int().min(0).max(100),
    replacementWindowDays: int(),
    pendingPaymentExpiryHours: int(1),
    paymentReminderAfterHours: int(1),
  }),
  store: z.object({
    name: z.string().trim().min(2).max(80),
    supportEmail: emailField,
    supportPhone: z.string().trim().max(30),
    lowStockThreshold: int(),
  }),
} satisfies { [K in keyof StoreSettings]: z.ZodType };

const checkboxes: Partial<Record<keyof StoreSettings, string[]>> = {
  payments: ["razorpayEnabled", "codEnabled"],
  fulfilment: ["autoCreateShipment"],
  notifications: ["notifyOnNewOrder"],
};

export async function saveSettingsAction(_: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireAdmin();
  const section = formData.get("_section") as keyof StoreSettings;
  const schema = schemas[section];
  if (!schema) return { error: "Unknown settings section." };
  // Unchecked checkboxes are absent from FormData, so default those fields to false first.
  const raw: Record<string, unknown> = Object.fromEntries((checkboxes[section] ?? []).map((k) => [k, false]));
  Object.assign(raw, Object.fromEntries(formData));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const before = (await getSettings())[section];
  await saveSetting(section, parsed.data as never);
  await audit({
    actor,
    action: "settings.update",
    entityType: "settings",
    entityId: section,
    summary: `Updated ${section} settings`,
    changes: diff(before as unknown as Record<string, unknown>, parsed.data as Record<string, unknown>),
  });
  revalidatePath("/admin/settings");
  return { ok: true, message: "Saved." };
}

export async function testEmailAction(): Promise<{ ok: boolean; message: string }> {
  const actor = await requireAdmin();
  const check = await verifySmtp();
  if (!check.ok) return check;
  const status = await sendMail({ ...testEmailTemplate(), to: actor.email, template: "smtp_test", userId: actor.id });
  return { ok: status === "sent", message: status === "sent" ? `Test email sent to ${actor.email}.` : "Sending failed. See Emails for the error." };
}

export async function runMaintenanceAction() {
  const actor = await requireAdmin();
  const r = await runMaintenance();
  await audit({ actor, action: "maintenance.run", entityType: "settings", summary: `Ran maintenance: ${r.reminded} reminders, ${r.expired} expired` });
  return { ok: r.errors.length === 0, message: `Sent ${r.reminded} payment reminder(s), cancelled ${r.expired} unpaid order(s).${r.errors.length ? ` Errors: ${r.errors.join("; ")}` : ""}` };
}

export async function testShiprocketAction() {
  await requireAdmin();
  return testShiprocket();
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit, diff } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { sendMail, verifySmtp } from "@/lib/mail/send";
import { testEmailTemplate } from "@/lib/mail/templates";
import { getSettings, saveSetting } from "@/lib/settings";
import type { StoreSettings } from "@/lib/settings-defaults";
import { testShiprocket } from "@/lib/shiprocket";
import { emailField, fieldErrors, type FormState } from "@/lib/validation";

const bool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
const int = (min = 0) => z.coerce.number().int().min(min);

const schemas = {
  shipping: z.object({ freeShippingThreshold: int(), flatFee: int() }),
  payments: z.object({ razorpayEnabled: bool, codEnabled: bool, codFee: int() }),
  fulfilment: z.object({ autoCreateShipment: bool, packageLengthCm: int(1), packageBreadthCm: int(1), packageHeightCm: int(1) }),
  notifications: z.object({ adminEmail: emailField, notifyOnNewOrder: bool }),
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

export async function testShiprocketAction() {
  await requireAdmin();
  return testShiprocket();
}

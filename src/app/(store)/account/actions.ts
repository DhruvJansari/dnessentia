"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addresses, db, users } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { destroyAllSessions, createSession, requireUser } from "@/lib/auth/session";
import { addressSchema, fieldErrors, passwordField, phoneField, type FormState } from "@/lib/validation";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  phone: z.union([z.literal(""), phoneField]).optional(),
});

export async function updateProfileAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  await db.update(users).set({ name: parsed.data.name, phone: parsed.data.phone || null }).where(eq(users.id, user.id));
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile saved." };
}

const passwordSchema = z
  .object({ current: z.string().min(1, "Enter your current password"), password: passwordField, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

export async function changePasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const row = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  if (!(await verifyPassword(parsed.data.current, row?.passwordHash ?? null))) {
    return { fieldErrors: { current: "That's not your current password." } };
  }
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(users.id, user.id));
  // Sign out other devices, keep this one signed in.
  await destroyAllSessions(user.id);
  await createSession(user.id);
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}

export async function saveAddressAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const id = Number(formData.get("id") || 0);
  const makeDefault = formData.get("isDefault") === "on";
  const existing = await db.select({ id: addresses.id }).from(addresses).where(eq(addresses.userId, user.id));

  if (makeDefault || existing.length === 0) {
    await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  }
  const values = { ...parsed.data, isDefault: makeDefault || existing.length === 0 };
  if (id) {
    await db.update(addresses).set(values).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  } else {
    await db.insert(addresses).values({ ...values, userId: user.id });
  }
  revalidatePath("/account/addresses");
  return { ok: true, message: id ? "Address updated." : "Address added." };
}

export async function deleteAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const row = await db.query.addresses.findFirst({ where: and(eq(addresses.id, id), eq(addresses.userId, user.id)) });
  if (!row) return;
  await db.delete(addresses).where(eq(addresses.id, id));
  if (row.isDefault) {
    const next = await db.query.addresses.findFirst({ where: and(eq(addresses.userId, user.id), ne(addresses.id, id)) });
    if (next) await db.update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
  }
  revalidatePath("/account/addresses");
}

export async function setDefaultAddressAction(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  await db.update(addresses).set({ isDefault: false }).where(eq(addresses.userId, user.id));
  await db.update(addresses).set({ isDefault: true }).where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

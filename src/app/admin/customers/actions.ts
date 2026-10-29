"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, users } from "@/db";
import { audit, diff } from "@/lib/audit";
import { markEmailVerified, sendPasswordResetEmail, sendVerificationEmail } from "@/lib/auth/accounts";
import { hashPassword } from "@/lib/auth/password";
import { emailField, fieldErrors, phoneField, type FormState } from "@/lib/validation";
import { destroyAllSessions, requireAdmin, requireStaff } from "@/lib/auth/session";

export type CustomerResult = { ok: boolean; message: string };

export async function setCustomerActiveAction(userId: number, isActive: boolean): Promise<CustomerResult> {
  const actor = await requireStaff();
  if (actor.id === userId) return { ok: false, message: "You can't disable your own account." };
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return { ok: false, message: "User not found." };
  if (u.role !== "customer" && actor.role !== "admin") return { ok: false, message: "Only admins can change team accounts." };
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
  if (!isActive) await destroyAllSessions(userId);
  await audit({ actor, action: isActive ? "user.enable" : "user.disable", entityType: "user", entityId: userId, summary: `${isActive ? "Enabled" : "Disabled"} ${u.email}` });
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true, message: isActive ? "Account enabled." : "Account disabled and signed out everywhere." };
}

export async function setRoleAction(userId: number, role: "customer" | "staff" | "admin"): Promise<CustomerResult> {
  const actor = await requireAdmin();
  if (actor.id === userId) return { ok: false, message: "You can't change your own role." };
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return { ok: false, message: "User not found." };
  await db.update(users).set({ role }).where(eq(users.id, userId));
  await audit({ actor, action: "user.role", entityType: "user", entityId: userId, summary: `${u.email}: ${u.role} → ${role}`, changes: { role: { from: u.role, to: role } } });
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true, message: `Role changed to ${role}.` };
}

export async function sendResetLinkAction(userId: number): Promise<CustomerResult> {
  const actor = await requireStaff();
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return { ok: false, message: "User not found." };
  const status = await sendPasswordResetEmail(u);
  await audit({ actor, action: "user.reset_link", entityType: "user", entityId: userId, summary: `Sent password reset link to ${u.email} (${status})` });
  return { ok: status !== "failed", message: status === "sent" ? "Reset link emailed." : status === "skipped" ? "SMTP not configured; link was logged." : "Email failed." };
}

export async function resendVerifyAction(userId: number): Promise<CustomerResult> {
  const actor = await requireStaff();
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return { ok: false, message: "User not found." };
  const status = await sendVerificationEmail(u);
  await audit({ actor, action: "user.verify_link", entityType: "user", entityId: userId, summary: `Sent verification email to ${u.email} (${status})` });
  return { ok: status !== "failed", message: status === "sent" ? "Verification email sent." : status === "skipped" ? "SMTP not configured; link was logged." : "Email failed." };
}

const detailsSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(120),
  email: emailField,
  phone: z.union([z.literal(""), phoneField]).optional(),
});

export async function updateUserDetailsAction(userId: number, _: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireStaff();
  const parsed = detailsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const before = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!before) return { error: "User not found." };
  if (before.role !== "customer" && actor.role !== "admin") return { error: "Only admins can edit team accounts." };
  if (parsed.data.email !== before.email) {
    const taken = await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) });
    if (taken) return { fieldErrors: { email: "Another account already uses this email." } };
  }
  const values = { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone || null };
  await db
    .update(users)
    .set({ ...values, ...(parsed.data.email !== before.email ? { emailVerifiedAt: null } : {}) })
    .where(eq(users.id, userId));
  await audit({ actor, action: "user.update", entityType: "user", entityId: userId, summary: `Updated details of ${values.email}`, changes: diff(before as unknown as Record<string, unknown>, values) });
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true, message: parsed.data.email !== before.email ? "Saved. The new email needs verifying." : "Saved." };
}

const createSchema = detailsSchema.extend({ role: z.enum(["customer", "staff", "admin"]) });

/** Creates an account and emails a "set your password" link (the password-reset flow), so no password is shared. */
export async function createUserAction(_: FormState, formData: FormData): Promise<FormState> {
  const actor = await requireStaff();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  if (parsed.data.role !== "customer" && actor.role !== "admin") return { error: "Only admins can add team members." };
  if (await db.query.users.findFirst({ where: eq(users.email, parsed.data.email) })) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }
  const [res] = await db.insert(users).values({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    role: parsed.data.role,
    passwordHash: await hashPassword(randomBytes(24).toString("base64url")),
  });
  const status = await sendPasswordResetEmail({ id: res.insertId, email: parsed.data.email });
  await audit({ actor, action: "user.create", entityType: "user", entityId: res.insertId, summary: `Created ${parsed.data.role} ${parsed.data.email}` });
  revalidatePath("/admin/customers");
  return {
    ok: true,
    message:
      status === "sent"
        ? `Account created. ${parsed.data.email} has been emailed a link to set their password.`
        : "Account created. SMTP isn't set up, so send them to Forgot password to set a password.",
  };
}

export async function signOutEverywhereAction(userId: number): Promise<CustomerResult> {
  const actor = await requireStaff();
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return { ok: false, message: "User not found." };
  if (u.role !== "customer" && actor.role !== "admin") return { ok: false, message: "Only admins can manage team sessions." };
  await destroyAllSessions(userId);
  await audit({ actor, action: "user.signout_all", entityType: "user", entityId: userId, summary: `Signed ${u.email} out of all devices` });
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true, message: "Signed out of all devices." };
}

export async function markVerifiedAction(userId: number): Promise<CustomerResult> {
  const actor = await requireStaff();
  const result = await markEmailVerified(userId);
  if (!result) return { ok: false, message: "User not found." };
  await audit({ actor, action: "user.verify", entityType: "user", entityId: userId, summary: `Marked ${result.user.email} as verified (${result.linked} guest orders linked)` });
  revalidatePath(`/admin/customers/${userId}`);
  return { ok: true, message: `Email marked as verified.${result.linked ? ` ${result.linked} guest order(s) linked.` : ""}` };
}

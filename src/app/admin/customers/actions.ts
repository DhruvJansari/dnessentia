"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, users } from "@/db";
import { audit } from "@/lib/audit";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/auth/accounts";
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

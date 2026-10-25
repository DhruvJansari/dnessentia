"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, users } from "@/db";
import { rateLimit } from "../rate-limit";
import { requestMeta } from "../request";
import { emailField, fieldErrors, passwordField, type FormState } from "../validation";
import {
  consumeToken,
  createCustomer,
  findUserByEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "./accounts";
import { hashPassword, verifyPassword } from "./password";
import { createSession, destroyAllSessions, destroySession, getSessionUser, isStaff } from "./session";

/** Only allow redirects back into this site. */
function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

const loginSchema = z.object({ email: emailField, password: z.string().min(1, "Enter your password") });

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { email, password } = parsed.data;

  const { ip } = await requestMeta();
  if (!rateLimit(`login:${ip}:${email}`, 8, 15 * 60e3)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }

  const user = await findUserByEmail(email);
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) return { error: "Incorrect email or password." };
  if (!user.isActive) return { error: "This account has been disabled. Please contact support." };

  await createSession(user.id);
  redirect(safeNext(formData.get("next"), isStaff({ ...user, emailVerified: Boolean(user.emailVerifiedAt) }) ? "/admin" : "/account"));
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: emailField,
  password: passwordField,
});

export async function registerAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { ip } = await requestMeta();
  if (!rateLimit(`register:${ip}`, 5, 60 * 60e3)) return { error: "Too many sign-ups from this network. Try again later." };

  if (await findUserByEmail(parsed.data.email)) {
    return { fieldErrors: { email: "An account with this email already exists. Log in instead." } };
  }
  const userId = await createCustomer(parsed.data);
  await createSession(userId);
  await sendVerificationEmail({ id: userId, email: parsed.data.email, name: parsed.data.name });
  redirect(safeNext(formData.get("next"), "/account?welcome=1"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = z.object({ email: emailField }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const { ip } = await requestMeta();
  if (rateLimit(`forgot:${ip}`, 5, 15 * 60e3)) {
    const user = await findUserByEmail(parsed.data.email);
    if (user?.isActive) await sendPasswordResetEmail(user);
  }
  // Same answer whether or not the account exists, so emails can't be enumerated.
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. Check your inbox." };
}

const resetSchema = z
  .object({ token: z.string().min(10), password: passwordField, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };
  const userId = await consumeToken(parsed.data.token, "password_reset");
  if (!userId) return { error: "This reset link is invalid or has expired. Request a new one." };
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(users.id, userId));
  await destroyAllSessions(userId);
  await createSession(userId);
  redirect("/account?reset=1");
}

export async function resendVerificationAction(): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in first." };
  if (user.emailVerified) return { ok: true, message: "Your email is already verified." };
  if (!rateLimit(`verify:${user.id}`, 3, 60 * 60e3)) return { error: "Please wait a while before requesting another email." };
  await sendVerificationEmail(user);
  return { ok: true, message: `Verification email sent to ${user.email}.` };
}

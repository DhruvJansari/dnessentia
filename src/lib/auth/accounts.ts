import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { authTokens, db, orders, users } from "@/db";
import { orderEvent } from "../audit";
import { env } from "../env";
import { sendMail } from "../mail/send";
import { accountCreatedTemplate, passwordResetTemplate, verifyEmailTemplate } from "../mail/templates";
import { hashToken, newToken } from "../tokens";
import { hashPassword } from "./password";

type Purpose = "password_reset" | "verify_email";

const SET_PASSWORD_TTL_DAYS = 7;

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
}

/** Without a password (e.g. "Create an account" at checkout) a random one is set; the customer chooses their own via sendSetPasswordEmail. */
export async function createCustomer(data: { email: string; name: string; phone?: string | null; password?: string }) {
  const [res] = await db.insert(users).values({
    email: data.email.toLowerCase().trim(),
    name: data.name,
    phone: data.phone ?? null,
    passwordHash: await hashPassword(data.password ?? randomBytes(24).toString("base64url")),
    role: "customer",
  });
  return res.insertId;
}

async function issueToken(userId: number, purpose: Purpose, ttlMs: number) {
  const { token, hash } = newToken();
  await db.insert(authTokens).values({ id: hash, userId, purpose, expiresAt: new Date(Date.now() + ttlMs) });
  return token;
}

/** Returns the user id if the token is valid, and marks it used. */
export async function consumeToken(token: string, purpose: Purpose) {
  const hash = hashToken(token);
  const row = await db.query.authTokens.findFirst({
    where: and(eq(authTokens.id, hash), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())),
  });
  if (!row) return null;
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, hash));
  return row.userId;
}

export async function sendVerificationEmail(user: { id: number; email: string; name: string }) {
  const token = await issueToken(user.id, "verify_email", 48 * 3600e3);
  const link = `${env.appUrl}/verify-email?token=${token}`;
  return sendMail({ ...verifyEmailTemplate(user.name, link), to: user.email, template: "verify_email", userId: user.id });
}

export async function sendPasswordResetEmail(user: { id: number; email: string }) {
  const token = await issueToken(user.id, "password_reset", 3600e3);
  const link = `${env.appUrl}/reset-password?token=${token}`;
  return sendMail({ ...passwordResetTemplate(link), to: user.email, template: "password_reset", userId: user.id });
}

/** Welcome email for accounts created without a password (checkout, admin). The link sets the password and verifies the email. */
export async function sendSetPasswordEmail(user: { id: number; email: string; name: string }) {
  const token = await issueToken(user.id, "password_reset", SET_PASSWORD_TTL_DAYS * 24 * 3600e3);
  const link = `${env.appUrl}/reset-password?token=${token}`;
  return sendMail({ ...accountCreatedTemplate(user.name, link, SET_PASSWORD_TTL_DAYS), to: user.email, template: "account_created", userId: user.id });
}

/**
 * Attaches earlier guest orders placed with this email to the account.
 * Only called once the email is verified, so nobody can claim someone else's orders by signing up with their address.
 */
export async function linkGuestOrders(userId: number, email: string) {
  const guestOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.email, email), isNull(orders.userId)));
  if (guestOrders.length === 0) return 0;
  await db.update(orders).set({ userId }).where(and(eq(orders.email, email), isNull(orders.userId)));
  for (const o of guestOrders) {
    await orderEvent({ orderId: o.id, type: "note", message: "Linked to the customer's verified account", isInternal: true });
  }
  return guestOrders.length;
}

export async function markEmailVerified(userId: number) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return null;
  if (!user.emailVerifiedAt) await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
  const linked = await linkGuestOrders(userId, user.email);
  return { user, linked };
}

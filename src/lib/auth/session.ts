import "server-only";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { db, sessions, users } from "@/db";
import { env } from "../env";
import { requestMeta } from "../request";
import { hashToken, newToken } from "../tokens";

export const SESSION_COOKIE = "dn_session";
const SESSION_DAYS = 30;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  role: "customer" | "staff" | "admin";
  emailVerified: boolean;
};

export async function createSession(userId: number) {
  const { token, hash } = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 864e5);
  const { ip, userAgent } = await requestMeta();
  await db.insert(sessions).values({ id: hash, userId, expiresAt, ip, userAgent });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  // Opportunistic cleanup of expired sessions.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

/** Signs a user out everywhere (after a password reset, for example). */
export async function destroyAllSessions(userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** The signed-in user for this request, or null. Deduplicated per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  // Session expiry is checked against the current time, so this must run per request.
  await connection();
  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!row || !row.isActive) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    role: row.role,
    emailVerified: Boolean(row.emailVerifiedAt),
  };
});

export async function requireUser(next = "/account") {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export function isStaff(user: SessionUser | null): user is SessionUser {
  return user?.role === "admin" || user?.role === "staff";
}

/** Staff and admins can manage orders and products. */
export async function requireStaff() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!isStaff(user)) redirect("/account");
  return user;
}

/** Only admins can change settings, coupons and team roles. */
export async function requireAdmin() {
  const user = await requireStaff();
  if (user.role !== "admin") redirect("/admin");
  return user;
}

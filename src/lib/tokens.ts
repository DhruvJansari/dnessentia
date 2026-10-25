import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** A random URL-safe secret (handed to the user) and its SHA-256 hash (stored in the database). */
export function newToken(bytes = 32) {
  const token = randomBytes(bytes).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

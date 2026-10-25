import "server-only";
import bcrypt from "bcryptjs";

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string | null) {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(password, hash);
}

/**
 * Creates an admin/staff user or resets an existing user's password and role.
 *   npm run admin:create -- someone@example.com "a-strong-password" [admin|staff]
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { connect, schema } from "./db";

async function main() {
  const [emailArg, password, roleArg = "admin"] = process.argv.slice(2);
  const role = roleArg === "staff" ? "staff" : "admin";
  if (!emailArg || !password || password.length < 8) {
    console.error('Usage: npm run admin:create -- email "password (8+ chars)" [admin|staff]');
    process.exit(1);
  }
  const email = emailArg.toLowerCase().trim();
  const { db, close } = await connect();
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (existing) {
    await db.update(schema.users).set({ role, passwordHash, isActive: true }).where(eq(schema.users.id, existing.id));
    console.log(`Updated ${email} (role: ${role})`);
  } else {
    await db.insert(schema.users).values({ email, name: "Store Admin", role, passwordHash, emailVerifiedAt: new Date() });
    console.log(`Created ${email} (role: ${role})`);
  }
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

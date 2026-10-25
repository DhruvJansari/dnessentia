// Standalone DB connection for CLI scripts (src/db/index.ts is server-only and can't be imported here).
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../src/db/schema";

export async function connect() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (run with --env-file=.env.local)");
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL, connectionLimit: 2, timezone: "Z" });
  pool.on("connection", (conn) => conn.query("SET time_zone = '+00:00'"));
  const db = drizzle(pool, { schema, mode: "default", casing: "snake_case" });
  return { db, close: () => pool.end() };
}

export { schema };

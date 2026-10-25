import "server-only";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { dnPool?: mysql.Pool };

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  const pool = mysql.createPool({ uri: url, connectionLimit: 10, timezone: "Z", dateStrings: false });
  // Store and read TIMESTAMPs in UTC regardless of the MySQL server's time zone; the UI formats for Asia/Kolkata.
  pool.on("connection", (conn) => conn.query("SET time_zone = '+00:00'"));
  return pool;
}

// Reuse one pool across hot reloads in development.
const pool = globalForDb.dnPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.dnPool = pool;

export const db = drizzle(pool, { schema, mode: "default", casing: "snake_case" });
export type DB = typeof db;
export * from "./schema";

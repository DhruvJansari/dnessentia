import "server-only";
import { headers } from "next/headers";

export async function requestMeta() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim().slice(0, 64) || null;
  const userAgent = h.get("user-agent")?.slice(0, 255) ?? null;
  return { ip, userAgent };
}

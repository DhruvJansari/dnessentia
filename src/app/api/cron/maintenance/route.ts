import { env } from "@/lib/env";
import { runMaintenance } from "@/lib/orders/maintenance";
import { safeEqual } from "@/lib/tokens";

/**
 * Scheduled housekeeping. Call every 15 minutes, e.g. from the server's crontab:
 *   *\/15 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://dnessentia.com/api/cron/maintenance
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  if (!env.cronSecret || !safeEqual(auth, `Bearer ${env.cronSecret}`)) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  return Response.json(await runMaintenance());
}

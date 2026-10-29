import { env } from "@/lib/env";
import { runMaintenance } from "@/lib/orders/maintenance";
import { safeEqual } from "@/lib/tokens";

/**
 * Scheduled housekeeping. The production server calls this itself every 15 minutes (src/instrumentation.ts).
 * An external crontab works too (then set INTERNAL_CRON=false):
 *   *\/15 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://dnessentia.com/api/cron/maintenance
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  if (!env.cronSecret || !safeEqual(auth, `Bearer ${env.cronSecret}`)) {
    return Response.json({ error: "unauthorised" }, { status: 401 });
  }
  return Response.json(await runMaintenance());
}

/**
 * Built-in scheduler for /api/cron/maintenance (payment checks, unpaid-order reminders and expiry, courier tracking).
 * Runs every 15 minutes inside the production server, so nothing breaks if the crontab or webhooks aren't set up.
 * Set INTERNAL_CRON=false when an external crontab already calls the endpoint.
 */
const EVERY_MS = 15 * 60e3;

export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  if (process.env.INTERNAL_CRON === "false" || !process.env.CRON_SECRET) return;

  const url = `http://127.0.0.1:${process.env.PORT || 3000}/api/cron/maintenance`;
  const run = () =>
    fetch(url, { method: "POST", headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } })
      .then(async (res) => {
        if (!res.ok) console.error(`[maintenance] ${res.status} ${await res.text()}`);
      })
      .catch((err) => console.error("[maintenance] failed:", err instanceof Error ? err.message : err));

  // First run shortly after start-up (the server isn't listening yet while register() runs).
  setTimeout(run, 60e3).unref();
  setInterval(run, EVERY_MS).unref();
}

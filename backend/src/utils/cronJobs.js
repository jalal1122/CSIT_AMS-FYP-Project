import cron from "node-cron";
import { runDefaulterCheck } from "../controllers/cron.controller.js";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOCAL DEVELOPMENT CRON JOBS
 *
 * These only run when NODE_ENV !== 'production'.
 * On production (cPanel), the Linux OS cron calls the /api/v2/cron/* endpoints.
 *
 * Schedule is fully configurable via .env:
 *   CRON_ALERT_HOUR  = hour to fire (0-23), default 17 (5 PM)
 *   CRON_ALERT_DAY   = weekday to fire (0=Sun … 5=Fri … 6=Sat), default 5
 *   CRON_TIMEZONE    = TZ string, default 'Asia/Karachi'
 *
 * FOR LOCAL TESTING:
 *   Set CRON_ALERT_HOUR to a minute or two from now and any day of the week.
 *   Example: CRON_ALERT_HOUR=14 CRON_ALERT_DAY=2 (Tues 2 PM)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const initCronJobs = () => {
  // Skip in production — cPanel handles scheduling externally
  if (process.env.NODE_ENV === "production") {
    console.log("[CRON] ⏭️  Skipping node-cron init (production mode — use cPanel cron).");
    return;
  }

  // Read schedule from .env with sensible defaults
  const hour = process.env.CRON_ALERT_HOUR ?? "17";      // Default: 5 PM
  const day  = process.env.CRON_ALERT_DAY  ?? "5";       // Default: Friday
  const tz   = process.env.CRON_TIMEZONE   ?? "Asia/Karachi";

  // Build cron expression: "0 <hour> * * <day>"
  const cronExpression = `0 ${hour} * * ${day}`;

  console.log(`[CRON] ✅ Registered defaulter job: "${cronExpression}" (TZ: ${tz})`);

  cron.schedule(cronExpression, async () => {
    console.log(`[CRON] ⏰ Defaulter alert triggered by schedule: ${cronExpression}`);
    try {
      await runDefaulterCheck();
    } catch (err) {
      console.error("[CRON] ❌ Scheduled defaulter check failed:", err);
    }
  }, { timezone: tz });
};

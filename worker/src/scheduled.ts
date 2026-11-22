import { type Env, nowIso } from "./http.js";

/**
 * The project's only cron runs every 10 minutes. Each task decides from the
 * scheduled time whether it is its turn, so new periodic work is a new branch
 * here, never a new cron.
 */
export async function runScheduled(scheduledTime: number, env: Env): Promise<string[]> {
  const at = new Date(scheduledTime);
  const done: string[] = [];

  // Once a day, in the first run after 00:00 UTC.
  if (at.getUTCHours() === 0 && at.getUTCMinutes() < 10) {
    const changed = await expireOpportunities(at, env);
    done.push(`expired:${changed}`);
  }

  return done;
}

/** Approved opportunities whose deadline has passed leave the catalog. */
export async function expireOpportunities(at: Date, env: Env): Promise<number> {
  const today = at.toISOString().slice(0, 10);
  const res = await env.DB.prepare(
    `UPDATE opportunities SET status = 'expired', updated_at = ? WHERE status = 'approved' AND deadline < ?`,
  )
    .bind(nowIso(), today)
    .run();
  return res.meta.changes ?? 0;
}

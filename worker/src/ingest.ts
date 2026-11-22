import { HttpError, type Env, nowIso, readJson } from "./http.js";

/** Most drafts per call: each is one D1 statement, and a call may run at most 50. */
export const MAX_BATCH = 40;

interface IncomingDraft {
  fingerprint: string;
  sourceId: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  collectedAt: string;
  provider: string;
  model: string;
  needsCheck: string[];
  card: Record<string, unknown> & { title_uz: string; type: string; deadline: string | null };
}

const isStr = (v: unknown, max = 2000): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Shape check of what the collector sends. Content itself is checked by a moderator. */
export function validDraft(d: unknown): d is IncomingDraft {
  if (!d || typeof d !== "object") return false;
  const x = d as Record<string, unknown>;
  const card = x.card as Record<string, unknown> | undefined;
  return (
    isStr(x.fingerprint, 64) &&
    isStr(x.sourceId, 100) &&
    isStr(x.sourceUrl) &&
    (x.sourcePublishedAt === null || isStr(x.sourcePublishedAt, 40)) &&
    isStr(x.collectedAt, 40) &&
    isStr(x.provider, 100) &&
    isStr(x.model, 200) &&
    Array.isArray(x.needsCheck) &&
    x.needsCheck.every((r) => isStr(r, 50)) &&
    !!card &&
    typeof card === "object" &&
    isStr(card.title_uz, 500) &&
    isStr(card.type, 50) &&
    (card.deadline === null || isDate(card.deadline)) &&
    JSON.stringify(card).length <= 50_000
  );
}

/** POST /api/internal/drafts: stores new drafts, ignores ones already known. */
export async function ingestDrafts(request: Request, env: Env): Promise<{ received: number; inserted: number }> {
  const body = await readJson<{ drafts?: unknown[] }>(request);
  const drafts = body.drafts;
  if (!Array.isArray(drafts) || drafts.length === 0) throw new HttpError(400, "drafts must be a non-empty array");
  if (drafts.length > MAX_BATCH) throw new HttpError(413, `at most ${MAX_BATCH} drafts per request`);
  const bad = drafts.findIndex((d) => !validDraft(d));
  if (bad >= 0) throw new HttpError(400, `invalid draft at index ${bad}`);

  const now = nowIso();
  const stmt = env.DB.prepare(
    `INSERT INTO opportunities
       (fingerprint, status, source_id, source_url, source_published_at, collected_at, provider, model, needs_check, title_uz, type, deadline, card, updated_at)
     VALUES (?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (fingerprint) DO NOTHING`,
  );
  const results = await env.DB.batch(
    (drafts as IncomingDraft[]).map((d) =>
      stmt.bind(
        d.fingerprint,
        d.sourceId,
        d.sourceUrl,
        d.sourcePublishedAt,
        d.collectedAt,
        d.provider,
        d.model,
        JSON.stringify(d.needsCheck),
        d.card.title_uz,
        d.card.type,
        d.card.deadline,
        JSON.stringify(d.card),
        now,
      ),
    ),
  );
  const inserted = results.reduce((n, r) => n + (r.meta.changes ?? 0), 0);
  return { received: drafts.length, inserted };
}

interface UsageReport {
  day?: unknown;
  usage?: Record<string, { requests?: unknown; failures?: unknown; rateLimited?: unknown }>;
}

const count = (v: unknown) => (Number.isInteger(v) && (v as number) >= 0 && (v as number) < 1_000_000 ? (v as number) : 0);

/** POST /api/internal/ai-usage: adds one run's usage to the (provider, day) rows. */
export async function ingestUsage(request: Request, env: Env): Promise<{ providers: number }> {
  const body = await readJson<UsageReport>(request, 20_000);
  if (!isDate(body.day)) throw new HttpError(400, "day must be YYYY-MM-DD");
  const entries = Object.entries(body.usage ?? {}).filter(([p]) => /^[a-z0-9_-]{1,40}$/.test(p));
  if (entries.length === 0) return { providers: 0 };
  if (entries.length > 20) throw new HttpError(413, "too many providers");
  const stmt = env.DB.prepare(
    `INSERT INTO ai_quota (provider, day, requests, failures, rate_limited) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (provider, day) DO UPDATE SET
       requests = requests + excluded.requests,
       failures = failures + excluded.failures,
       rate_limited = rate_limited + excluded.rate_limited`,
  );
  await env.DB.batch(entries.map(([p, u]) => stmt.bind(p, body.day, count(u.requests), count(u.failures), count(u.rateLimited))));
  return { providers: entries.length };
}

/** Bearer secret shared with the collector. Compared in constant time. */
export async function checkIngestSecret(request: Request, env: Env): Promise<void> {
  const expected = env.INGEST_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  if (!expected) throw new HttpError(503, "ingest is not configured");
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(given)), crypto.subtle.digest("SHA-256", enc.encode(expected))]);
  if (!crypto.subtle.timingSafeEqual(a, b)) throw new HttpError(401, "unauthorized");
}

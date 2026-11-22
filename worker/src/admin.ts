import { createRemoteJWKSet, jwtVerify } from "jose";
import { HttpError, type Env, nowIso, readJson } from "./http.js";

const jwksByTeam = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

/**
 * Checks the Cloudflare Access token on /api/admin/*. Access sits in front of
 * /admin and /api/admin; this check makes the API fail closed if Access is
 * misconfigured or bypassed. Returns the moderator's email.
 */
export async function requireModerator(request: Request, env: Env): Promise<string> {
  const team = env.ACCESS_TEAM_DOMAIN;
  const aud = env.ACCESS_AUD;
  if (!team || !aud) throw new HttpError(503, "admin access is not configured");
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new HttpError(401, "missing access token");
  const issuer = `https://${team}.cloudflareaccess.com`;
  let jwks = jwksByTeam.get(issuer);
  if (!jwks) jwksByTeam.set(issuer, (jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`))));
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer, audience: aud });
    if (typeof payload.email !== "string") throw new Error("no email");
    return payload.email;
  } catch {
    throw new HttpError(403, "invalid access token");
  }
}

const STATUSES = ["draft", "approved", "rejected", "expired"] as const;
type Status = (typeof STATUSES)[number];

interface Row {
  id: number;
  status: Status;
  source_id: string;
  source_url: string;
  source_published_at: string | null;
  collected_at: string;
  provider: string;
  model: string;
  needs_check: string;
  card: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

/**
 * GET /api/admin/opportunities?status=draft&cursor=...&limit=20
 * Newest first, keyset pagination on (collected_at, id) — no OFFSET, no COUNT(*).
 */
export async function listForModeration(url: URL, env: Env) {
  const status = (url.searchParams.get("status") ?? "draft") as Status;
  if (!STATUSES.includes(status)) throw new HttpError(400, "unknown status");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20) || 20, 1), 50);
  const cursor = url.searchParams.get("cursor");

  const cols = "id, status, source_id, source_url, source_published_at, collected_at, provider, model, needs_check, card, reviewed_at, reviewed_by";
  let rows: Row[];
  if (cursor) {
    const [collectedAt, id] = decodeCursor(cursor);
    rows = (
      await env.DB.prepare(
        `SELECT ${cols} FROM opportunities
         WHERE status = ? AND (collected_at < ? OR (collected_at = ? AND id < ?))
         ORDER BY collected_at DESC, id DESC LIMIT ?`,
      )
        .bind(status, collectedAt, collectedAt, id, limit + 1)
        .all<Row>()
    ).results;
  } else {
    rows = (
      await env.DB.prepare(`SELECT ${cols} FROM opportunities WHERE status = ? ORDER BY collected_at DESC, id DESC LIMIT ?`)
        .bind(status, limit + 1)
        .all<Row>()
    ).results;
  }

  const page = rows.slice(0, limit);
  const last = page.at(-1);
  return {
    items: page.map((r) => ({
      id: r.id,
      status: r.status,
      sourceId: r.source_id,
      sourceUrl: r.source_url,
      sourcePublishedAt: r.source_published_at,
      collectedAt: r.collected_at,
      provider: r.provider,
      model: r.model,
      needsCheck: JSON.parse(r.needs_check) as string[],
      card: JSON.parse(r.card) as Record<string, unknown>,
      reviewedAt: r.reviewed_at,
      reviewedBy: r.reviewed_by,
    })),
    nextCursor: rows.length > limit && last ? encodeCursor(last.collected_at, last.id) : null,
  };
}

function encodeCursor(collectedAt: string, id: number): string {
  return btoa(`${collectedAt}|${id}`);
}

function decodeCursor(cursor: string): [string, number] {
  try {
    const [collectedAt, id] = atob(cursor).split("|");
    const n = Number(id);
    if (!collectedAt || !Number.isInteger(n)) throw new Error();
    return [collectedAt, n];
  } catch {
    throw new HttpError(400, "invalid cursor");
  }
}

interface Decision {
  action?: unknown;
  card?: unknown;
}

/**
 * POST /api/admin/opportunities/:id  { action: "approve" | "reject", card?: {...edited} }
 * Only drafts can be decided; an edited card replaces the model's one.
 */
export async function decide(id: number, request: Request, env: Env, moderator: string) {
  const body = await readJson<Decision>(request, 100_000);
  if (body.action !== "approve" && body.action !== "reject") throw new HttpError(400, "action must be approve or reject");
  const status: Status = body.action === "approve" ? "approved" : "rejected";
  const now = nowIso();

  if (body.card !== undefined) {
    const card = body.card as Record<string, unknown>;
    const deadline = card?.deadline;
    if (
      !card ||
      typeof card !== "object" ||
      typeof card.title_uz !== "string" ||
      !card.title_uz.trim() ||
      typeof card.type !== "string" ||
      !(deadline === null || (typeof deadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(deadline)))
    ) {
      throw new HttpError(400, "invalid card");
    }
    const res = await env.DB.prepare(
      `UPDATE opportunities SET status = ?, card = ?, title_uz = ?, type = ?, deadline = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
       WHERE id = ? AND status = 'draft'`,
    )
      .bind(status, JSON.stringify(card), card.title_uz, card.type, deadline, now, moderator, now, id)
      .run();
    if (!res.meta.changes) throw new HttpError(409, "not a draft");
  } else {
    const res = await env.DB.prepare(
      `UPDATE opportunities SET status = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ? WHERE id = ? AND status = 'draft'`,
    )
      .bind(status, now, moderator, now, id)
      .run();
    if (!res.meta.changes) throw new HttpError(409, "not a draft");
  }
  return { id, status };
}

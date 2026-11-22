import { createExecutionContext, createScheduledController, env, waitOnExecutionContext } from "cloudflare:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { MAX_BATCH } from "../src/ingest";

const BASE = "https://grantchi.uz";
const ISSUER = "https://grantchi-test.cloudflareaccess.com";

const req = (url: string, init?: RequestInit) => new Request(url, init) as Request<unknown, IncomingRequestCfProperties>;

async function call(path: string, init: RequestInit = {}) {
  const ctx = createExecutionContext();
  const res = await worker.fetch(req(`${BASE}${path}`, init), env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

const ingest = (body: unknown, secret = "test-secret") =>
  call("/api/internal/drafts", {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

let seq = 0;
function draft(over: Record<string, unknown> = {}, card: Record<string, unknown> = {}) {
  seq++;
  return {
    fingerprint: `fp${seq.toString().padStart(14, "0")}`,
    sourceId: "opportunitydesk",
    sourceUrl: `https://example.org/post-${seq}`,
    sourcePublishedAt: "2026-11-20T10:00:00.000Z",
    collectedAt: `2026-11-21T10:00:${String(seq % 60).padStart(2, "0")}.000Z`,
    provider: "groq",
    model: "llama",
    needsCheck: ["no_deadline"],
    card: {
      is_opportunity: true,
      title_uz: `Stipendiya ${seq}`,
      summary_uz: "Magistratura uchun to'liq stipendiya.",
      type: "scholarship",
      deadline: "2027-01-05",
      requirements_uz: [],
      documents_uz: [],
      official_url: "https://example.org/apply",
      ...card,
    },
    ...over,
  };
}

// --- Cloudflare Access: a local key pair stands in for the team's certs.
let token: string;
let jwks: { keys: unknown[] };

beforeAll(async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  jwks = { keys: [{ ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256", use: "sig" }] };
  token = await new SignJWT({ email: "moder@grantchi.uz" })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(ISSUER)
    .setAudience("test-aud")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(privateKey);
});

function mockAccessCerts() {
  const real = globalThis.fetch;
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === `${ISSUER}/cdn-cgi/access/certs`) return Response.json(jwks);
    return real(input, init);
  });
}

const admin = (path: string, init: RequestInit = {}, jwt = token) =>
  call(path, { ...init, headers: { ...(init.headers as Record<string, string>), "cf-access-jwt-assertion": jwt } });

afterEach(() => vi.restoreAllMocks());

describe("POST /api/internal/drafts", () => {
  it("rejects a wrong or missing secret", async () => {
    expect((await ingest({ drafts: [draft()] }, "nope")).status).toBe(401);
    expect((await call("/api/internal/drafts", { method: "POST", body: "{}" })).status).toBe(401);
  });

  it("stores drafts once, ignoring repeats", async () => {
    const a = draft();
    const b = draft();
    expect(await (await ingest({ drafts: [a, b] })).json()).toEqual({ received: 2, inserted: 2 });
    expect(await (await ingest({ drafts: [a] })).json()).toEqual({ received: 1, inserted: 0 });

    const row = await env.DB.prepare("SELECT status, title_uz, type, deadline, needs_check FROM opportunities WHERE fingerprint = ?")
      .bind(a.fingerprint)
      .first();
    expect(row).toEqual({ status: "draft", title_uz: a.card.title_uz, type: "scholarship", deadline: "2027-01-05", needs_check: '["no_deadline"]' });
  });

  it("validates shape and batch size", async () => {
    expect((await ingest({ drafts: [] })).status).toBe(400);
    expect((await ingest({ drafts: [draft({}, { deadline: "5 Jan" })] })).status).toBe(400);
    expect((await ingest({ drafts: [{ fingerprint: "x" }] })).status).toBe(400);
    expect((await ingest({ drafts: Array.from({ length: MAX_BATCH + 1 }, () => draft()) })).status).toBe(413);
    expect((await call("/api/internal/drafts", { method: "POST", headers: { authorization: "Bearer test-secret" }, body: "{" })).status).toBe(400);
  });
});

describe("POST /api/internal/ai-usage", () => {
  it("adds up usage per (provider, day)", async () => {
    const send = (usage: unknown) =>
      call("/api/internal/ai-usage", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
        body: JSON.stringify({ day: "2026-11-22", usage }),
      });
    await send({ groq: { requests: 3, failures: 1, rateLimited: 1 } });
    await send({ groq: { requests: 2, failures: 0, rateLimited: 0 }, gemini: { requests: 1 } });
    const rows = await env.DB.prepare("SELECT provider, requests, failures, rate_limited FROM ai_quota WHERE day = ? ORDER BY provider").bind("2026-11-22").all();
    expect(rows.results).toEqual([
      { provider: "gemini", requests: 1, failures: 0, rate_limited: 0 },
      { provider: "groq", requests: 5, failures: 1, rate_limited: 1 },
    ]);
  });
});

describe("admin API", () => {
  it("needs a valid Access token", async () => {
    mockAccessCerts();
    expect((await call("/api/admin/opportunities")).status).toBe(401);
    expect((await admin("/api/admin/opportunities", {}, "garbage")).status).toBe(403);
  });

  it("fails closed when Access is not configured", async () => {
    const res = await worker.fetch(req(`${BASE}/api/admin/opportunities`), { ...env, ACCESS_AUD: "" }, createExecutionContext());
    expect(res.status).toBe(503);
  });

  it("lists drafts newest first with a cursor, then approves and rejects", async () => {
    mockAccessCerts();
    const drafts = [draft(), draft(), draft()];
    await ingest({ drafts });

    expect(await (await admin("/api/admin/me")).json()).toEqual({ email: "moder@grantchi.uz" });

    const all: { id: number; card: { title_uz: string } }[] = [];
    let cursor: string | null = null;
    do {
      const q: string = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
      const page = (await (await admin(`/api/admin/opportunities?status=draft&limit=2${q}`)).json()) as {
        items: { id: number; card: { title_uz: string } }[];
        nextCursor: string | null;
      };
      all.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    const titles = all.map((i) => i.card.title_uz);
    expect(titles.slice(0, 3)).toEqual(drafts.map((d) => d.card.title_uz).reverse());
    expect(new Set(all.map((i) => i.id)).size).toBe(all.length);

    const [first, second] = all;
    const edited = { ...drafts[2]!.card, title_uz: "Tahrirlangan sarlavha", deadline: "2027-02-01" };
    const approve = await admin(`/api/admin/opportunities/${first!.id}`, { method: "POST", body: JSON.stringify({ action: "approve", card: edited }) });
    expect(await approve.json()).toEqual({ id: first!.id, status: "approved" });
    const reject = await admin(`/api/admin/opportunities/${second!.id}`, { method: "POST", body: JSON.stringify({ action: "reject" }) });
    expect(reject.status).toBe(200);

    const row = await env.DB.prepare("SELECT status, title_uz, deadline, reviewed_by FROM opportunities WHERE id = ?").bind(first!.id).first();
    expect(row).toEqual({ status: "approved", title_uz: "Tahrirlangan sarlavha", deadline: "2027-02-01", reviewed_by: "moder@grantchi.uz" });

    // A decided card cannot be decided again.
    expect((await admin(`/api/admin/opportunities/${first!.id}`, { method: "POST", body: JSON.stringify({ action: "reject" }) })).status).toBe(409);
    expect((await admin(`/api/admin/opportunities/${second!.id}`, { method: "POST", body: JSON.stringify({ action: "maybe" }) })).status).toBe(400);
    expect((await admin("/api/admin/opportunities?status=nope")).status).toBe(400);
    expect((await admin("/api/admin/opportunities?cursor=%%%")).status).toBe(400);
  });
});

describe("scheduled", () => {
  it("expires approved opportunities past their deadline once a day", async () => {
    await ingest({ drafts: [draft({}, { deadline: "2026-11-01" }), draft({}, { deadline: "2027-01-01" })] });
    await env.DB.prepare("UPDATE opportunities SET status = 'approved' WHERE status = 'draft'").run();

    const run = async (iso: string) => {
      const ctx = createExecutionContext();
      await worker.scheduled(createScheduledController({ scheduledTime: new Date(iso).getTime(), cron: "*/10 * * * *" }), env, ctx);
      await waitOnExecutionContext(ctx);
    };
    const statusOf = (deadline: string) =>
      env.DB.prepare("SELECT status FROM opportunities WHERE deadline = ?").bind(deadline).first<{ status: string }>();

    await run("2026-11-22T12:00:00Z"); // not the daily slot
    expect((await statusOf("2026-11-01"))?.status).toBe("approved");

    await run("2026-11-22T00:00:00Z");
    expect((await statusOf("2026-11-01"))?.status).toBe("expired");
    expect((await statusOf("2027-01-01"))?.status).toBe("approved");
  });
});

describe("routing", () => {
  it("returns 404 for unknown API paths", async () => {
    expect((await call("/api/nope")).status).toBe(404);
    expect((await call("/api/internal/nope", { method: "POST", headers: { authorization: "Bearer test-secret" } })).status).toBe(404);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { needsCheck, parseCard } from "../src/ai/card.js";
import { providersFromEnv } from "../src/ai/providers.js";
import { Router } from "../src/ai/router.js";
import { fingerprint, interleave, isDue, normalizeUrl, run } from "../src/pipeline.js";
import type { Card, RawItem, Source } from "../src/types.js";

const fixture = (name: string) => readFileSync(new URL(`fixtures/${name}`, import.meta.url), "utf8");

const card = (over: Partial<Card> = {}): Card => ({
  is_opportunity: true,
  skip_reason: null,
  title_uz: "Namuna stipendiyasi",
  summary_uz: "Magistratura uchun to'liq stipendiya.",
  type: "scholarship",
  levels: ["master"],
  fields_uz: ["muhandislik"],
  host_countries: ["DE"],
  eligibility: "all",
  funding: "full",
  funding_details_uz: null,
  deadline: "2027-01-05",
  deadline_text: "January 5, 2027",
  requirements_uz: ["Bakalavr diplomi"],
  documents_uz: ["Pasport"],
  official_url: "https://example.org/apply",
  confidence: 0.9,
  ...over,
});

const chat = (content: string) => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });

describe("parseCard", () => {
  it("accepts JSON wrapped in prose or code fences", () => {
    expect(parseCard("```json\n" + JSON.stringify(card()) + "\n```").title_uz).toBe("Namuna stipendiyasi");
  });
  it("rejects answers that break the schema", () => {
    expect(() => parseCard(JSON.stringify({ ...card(), deadline: "5 Jan" }))).toThrow(/invalid card: deadline/);
    expect(() => parseCard("no json here")).toThrow(/no JSON/);
  });
});

describe("needsCheck", () => {
  it("flags missing facts", () => {
    expect(needsCheck(card())).toEqual([]);
    expect(needsCheck(card({ deadline: null, official_url: null, eligibility: "unknown", confidence: 0.3 }))).toEqual([
      "no_deadline",
      "no_official_url",
      "eligibility_unknown",
      "low_confidence",
    ]);
  });
});

describe("providersFromEnv", () => {
  it("uses only providers with keys, in the requested order", () => {
    const ps = providersFromEnv({ GROQ_API_KEY: "g", GEMINI_API_KEY: "m", AI_PROVIDERS: "groq,gemini,mistral", GROQ_MODEL: "x" });
    expect(ps.map((p) => [p.id, p.model])).toEqual([
      ["groq", "x"],
      ["gemini", "gemini-2.5-flash"],
    ]);
  });
  it("needs the account id for Workers AI", () => {
    expect(providersFromEnv({ CLOUDFLARE_AI_TOKEN: "t" })).toEqual([]);
    expect(providersFromEnv({ CLOUDFLARE_AI_TOKEN: "t", CLOUDFLARE_ACCOUNT_ID: "acc" })[0]!.baseUrl).toContain("/accounts/acc/ai/v1");
  });
});

describe("Router", () => {
  const providers = [
    { id: "a", baseUrl: "https://a", apiKey: "ka", model: "ma" },
    { id: "b", baseUrl: "https://b", apiKey: "kb", model: "mb" },
  ];

  it("moves to the next provider on 429 and keeps the exhausted one out", async () => {
    const calls: string[] = [];
    const router = new Router(providers, async (url) => {
      calls.push(String(url));
      return String(url).startsWith("https://a") ? new Response("", { status: 429 }) : chat("ok");
    });
    expect((await router.complete([], (t) => t)).provider.id).toBe("b");
    expect((await router.complete([], (t) => t)).provider.id).toBe("b");
    expect(calls).toEqual(["https://a/chat/completions", "https://b/chat/completions", "https://b/chat/completions"]);
    expect(router.usage.get("a")).toEqual({ requests: 1, failures: 1, rateLimited: 1 });
  });

  it("retries a rejected answer with the next provider without exhausting the first", async () => {
    const router = new Router(providers, async (url) => chat(String(url).startsWith("https://a") ? "bad" : "good"));
    const accept = (t: string) => {
      if (t !== "good") throw new Error("rejected");
      return t;
    };
    expect((await router.complete([], accept)).provider.id).toBe("b");
    expect((await router.complete([], accept)).provider.id).toBe("b");
    expect(router.usage.get("a")?.requests).toBe(2);
    expect(router.available).toBe(true);
  });

  it("fails when every provider fails", async () => {
    const router = new Router(providers, async () => new Response("", { status: 401 }));
    await expect(router.complete([], (t) => t)).rejects.toThrow(/all providers failed/);
    expect(router.available).toBe(false);
  });
});

describe("pipeline helpers", () => {
  it("normalizes URLs for dedupe", () => {
    expect(normalizeUrl("https://www.example.org/a/?utm_source=rss&id=1#top")).toBe("https://example.org/a/?id=1");
    expect(fingerprint("https://example.org/a/")).toBe(fingerprint("https://www.example.org/a?utm_medium=x"));
  });

  it("interleaves sources up to the limit", () => {
    const it = (s: string, n: number): RawItem => ({ sourceId: s, url: `${s}${n}`, title: "", text: "", publishedAt: null });
    expect(interleave([[it("a", 1), it("a", 2), it("a", 3)], [it("b", 1)]], 3).map((i) => i.url)).toEqual(["a1", "b1", "a2"]);
  });

  it("checks sources on their own schedule", () => {
    const s = { everyHours: 6 } as Source;
    const now = new Date("2026-10-05T12:00:00Z");
    expect(isDue(s, { seen: {}, lastChecked: {} }, now)).toBe(true);
    expect(isDue({ ...s, id: "x" }, { seen: {}, lastChecked: { x: "2026-10-05T09:00:00Z" } }, now)).toBe(false);
    expect(isDue({ ...s, id: "x" }, { seen: {}, lastChecked: { x: "2026-10-05T06:00:00Z" } }, now)).toBe(true);
  });
});

describe("run", () => {
  const source: Source = { id: "ex", name: "Example", kind: "rss", url: "https://example.org/feed/", everyHours: 6 };
  const now = new Date("2026-10-05T12:00:00Z");
  const opts = { now, maxItems: 10, maxAgeDays: 45, force: false };

  const fetchImpl = (answers: Card[]) => {
    let i = 0;
    return async (url: string | URL | Request) =>
      String(url) === source.url ? new Response(fixture("feed.xml")) : chat(JSON.stringify(answers[i++]));
  };

  it("turns new items into drafts and skips non-opportunities", async () => {
    const f = fetchImpl([card(), card({ is_opportunity: false, skip_reason: "news" })]);
    const router = new Router([{ id: "a", baseUrl: "https://a", apiKey: "k", model: "m" }], f);
    const state = { seen: {}, lastChecked: {} };
    const r = await run([source], state, router, { ...opts, fetchImpl: f });

    expect(r.drafts).toHaveLength(1);
    expect(r.drafts[0]).toMatchObject({ sourceId: "ex", provider: "a", model: "m", needsCheck: [] });
    expect(r.processed).toHaveLength(2);
    expect(r.stats).toMatchObject({ found: 2, fresh: 2, drafts: 1, notOpportunity: 1 });
    expect(state.lastChecked).toEqual({ ex: now.toISOString() });
  });

  it("drops cards whose deadline has passed", async () => {
    const f = fetchImpl([card({ deadline: "2026-09-01" }), card()]);
    const router = new Router([{ id: "a", baseUrl: "https://a", apiKey: "k", model: "m" }], f);
    const r = await run([source], { seen: {}, lastChecked: {} }, router, { ...opts, fetchImpl: f });
    expect(r.stats).toMatchObject({ drafts: 1, expired: 1 });
  });

  it("skips seen and old items, and keeps items pending without AI", async () => {
    const f = fetchImpl([]);
    const state = { seen: { [fingerprint("https://example.org/second/")]: "2026-10-01" }, lastChecked: {} };
    const r = await run([source], state, null, { ...opts, fetchImpl: f });
    expect(r.pending.map((i) => i.title)).toEqual(["Example Fellowship 2027 & Grant"]);
    expect(r.processed).toEqual([]);

    const old = await run([source], { seen: {}, lastChecked: {} }, null, { ...opts, now: new Date("2027-03-01T00:00:00Z"), fetchImpl: f });
    expect(old.pending).toEqual([]);
  });

  it("records source errors and carries on", async () => {
    const r = await run([source], { seen: {}, lastChecked: {} }, null, { ...opts, fetchImpl: async () => new Response("", { status: 403 }) });
    expect(r.sourceErrors).toEqual({ ex: "HTTP 403 for https://example.org/feed/" });
  });
});

import { describe, expect, it } from "vitest";
import { deliver, reportUsage } from "../src/sink.js";
import type { Draft } from "../src/types.js";

const draft = (n: number) => ({ fingerprint: `fp${n}` }) as unknown as Draft;

describe("deliver", () => {
  it("posts drafts to the Worker in batches of 20 with the secret", async () => {
    const calls: { url: string; auth: string | null; count: number }[] = [];
    const fetchImpl = async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { drafts: unknown[] };
      calls.push({ url: String(url), auth: new Headers(init?.headers).get("authorization"), count: body.drafts.length });
      return new Response("{}");
    };
    const out = await deliver(Array.from({ length: 45 }, (_, i) => draft(i)), {
      apiUrl: "https://grantchi.uz/",
      secret: "s",
      outDir: "unused",
      runId: "r",
      fetchImpl,
    });
    expect(calls.map((c) => c.count)).toEqual([20, 20, 5]);
    expect(calls[0]).toMatchObject({ url: "https://grantchi.uz/api/internal/drafts", auth: "Bearer s" });
    expect(out).toBe("sent 45 drafts to https://grantchi.uz/");
  });

  it("fails loudly when the Worker refuses", async () => {
    await expect(
      deliver([draft(1)], { apiUrl: "https://x", secret: "s", outDir: "o", runId: "r", fetchImpl: async () => new Response("", { status: 401 }) }),
    ).rejects.toThrow(/HTTP 401/);
  });
});

describe("reportUsage", () => {
  it("is skipped without the Worker or without usage", async () => {
    const usage = { groq: { requests: 1, failures: 0, rateLimited: 0 } };
    expect(await reportUsage("2026-11-22", usage, {})).toBe(false);
    expect(await reportUsage("2026-11-22", {}, { apiUrl: "https://x", secret: "s" })).toBe(false);
  });

  it("posts the day and usage", async () => {
    let body: unknown;
    const ok = await reportUsage(
      "2026-11-22",
      { groq: { requests: 2, failures: 1, rateLimited: 1 } },
      { apiUrl: "https://x", secret: "s", fetchImpl: async (_u, init) => ((body = JSON.parse(String(init?.body))), new Response("{}")) },
    );
    expect(ok).toBe(true);
    expect(body).toEqual({ day: "2026-11-22", usage: { groq: { requests: 2, failures: 1, rateLimited: 1 } } });
  });
});

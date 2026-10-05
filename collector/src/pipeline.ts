import { createHash } from "node:crypto";
import { cardMessages, needsCheck, parseCard } from "./ai/card.js";
import type { Router } from "./ai/router.js";
import { fetchText, type FetchLike } from "./http.js";
import { parseDevpost } from "./parsers/devpost.js";
import { parseFeed } from "./parsers/rss.js";
import { parseTelegram } from "./parsers/telegram.js";
import { extractArticleText } from "./parsers/text.js";
import type { State } from "./state.js";
import type { Draft, RawItem, Source } from "./types.js";

export interface RunOptions {
  now: Date;
  /** Max items sent to the AI pool in one run, to stay inside free quotas. */
  maxItems: number;
  /** Items published earlier than this are ignored. */
  maxAgeDays: number;
  /** Check every source regardless of its schedule. */
  force: boolean;
  fetchImpl?: FetchLike;
  log?: (msg: string) => void;
}

export interface RunResult {
  drafts: Draft[];
  /** Fingerprints to mark as seen once the drafts are delivered. */
  processed: string[];
  /** Items found but not processed (no AI configured or quota ran out). */
  pending: RawItem[];
  stats: Record<string, number>;
  sourceErrors: Record<string, string>;
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hash = "";
    for (const k of [...u.searchParams.keys()]) if (k.startsWith("utm_") || k === "fbclid") u.searchParams.delete(k);
    u.hostname = u.hostname.replace(/^www\./, "");
    return u.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
}

export function fingerprint(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex").slice(0, 16);
}

export function isDue(source: Source, state: State, now: Date): boolean {
  const last = state.lastChecked[source.id];
  return !last || now.getTime() - Date.parse(last) >= source.everyHours * 3_600_000 - 5 * 60_000;
}

export async function fetchSource(source: Source, fetchImpl?: FetchLike): Promise<RawItem[]> {
  const body = await fetchText(source.url, { fetchImpl });
  switch (source.kind) {
    case "rss":
      return parseFeed(body, source.id);
    case "telegram":
      return parseTelegram(body, source.id);
    case "devpost":
      return parseDevpost(body, source.id);
  }
}

/** Takes items from each source in turn, so one busy source does not use up the whole run. */
export function interleave(groups: RawItem[][], limit: number): RawItem[] {
  const out: RawItem[] = [];
  for (let i = 0; out.length < limit && groups.some((g) => i < g.length); i++) {
    for (const g of groups) {
      const item = g[i];
      if (item && out.length < limit) out.push(item);
    }
  }
  return out;
}

export async function run(sources: Source[], state: State, router: Router | null, opts: RunOptions): Promise<RunResult> {
  const log = opts.log ?? (() => {});
  const today = opts.now.toISOString().slice(0, 10);
  const minPublished = opts.now.getTime() - opts.maxAgeDays * 86_400_000;
  const stats: Record<string, number> = { sources: 0, found: 0, fresh: 0, drafts: 0, notOpportunity: 0, expired: 0, aiFailed: 0 };
  const sourceErrors: Record<string, string> = {};
  const byId = new Map(sources.map((s) => [s.id, s]));

  // 1. Fetch due sources.
  const groups: RawItem[][] = [];
  for (const source of sources) {
    if (!opts.force && !isDue(source, state, opts.now)) continue;
    stats.sources!++;
    try {
      const items = await fetchSource(source, opts.fetchImpl);
      state.lastChecked[source.id] = opts.now.toISOString();
      const fresh = items.filter(
        (it) =>
          it.url &&
          !state.seen[fingerprint(it.url)] &&
          (!it.publishedAt || Date.parse(it.publishedAt) >= minPublished),
      );
      // newest first within a source
      fresh.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
      stats.found! += items.length;
      stats.fresh! += fresh.length;
      groups.push(fresh);
      log(`${source.id}: ${items.length} items, ${fresh.length} new`);
    } catch (e) {
      sourceErrors[source.id] = (e as Error).message;
      log(`${source.id}: ERROR ${(e as Error).message}`);
    }
  }

  const queue = interleave(groups, opts.maxItems);
  const drafts: Draft[] = [];
  const processed: string[] = [];
  const pending: RawItem[] = [];

  // 2. Turn items into cards.
  for (const [i, item] of queue.entries()) {
    if (!router || !router.available) {
      pending.push(...queue.slice(i));
      break;
    }
    const source = byId.get(item.sourceId)!;
    const fp = fingerprint(item.url);
    const enriched = source.fetchArticle ? await withArticle(item, opts.fetchImpl) : item;
    try {
      const { value: card, provider } = await router.complete(cardMessages(enriched, today), parseCard);
      processed.push(fp);
      if (!card.is_opportunity) {
        stats.notOpportunity!++;
        continue;
      }
      if (card.deadline && card.deadline < today) {
        stats.expired!++;
        continue;
      }
      drafts.push({
        fingerprint: fp,
        sourceId: item.sourceId,
        sourceUrl: item.url,
        sourcePublishedAt: item.publishedAt,
        collectedAt: opts.now.toISOString(),
        provider: provider.id,
        model: provider.model,
        needsCheck: needsCheck(card),
        card,
      });
      stats.drafts!++;
    } catch (e) {
      // Left unseen: retried on the next run.
      stats.aiFailed!++;
      log(`AI failed for ${item.url}: ${(e as Error).message}`);
    }
  }

  return { drafts, processed, pending, stats, sourceErrors };
}

/** Replaces the feed excerpt with the article's full text when the page is reachable. */
async function withArticle(item: RawItem, fetchImpl?: FetchLike): Promise<RawItem> {
  try {
    const html = await fetchText(item.url, { fetchImpl });
    const text = extractArticleText(html);
    return text.length > item.text.length ? { ...item, text } : item;
  } catch {
    return item;
  }
}

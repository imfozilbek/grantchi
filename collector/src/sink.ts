import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FetchLike } from "./http.js";
import type { Draft } from "./types.js";

const BATCH = 20;

/**
 * Sends drafts to the Worker (grantchi.uz/api/internal/drafts) when it is
 * configured, in batches so one Worker call stays well under 50 D1 queries.
 * Without it, drafts are written to a JSON file for review.
 */
export async function deliver(
  drafts: Draft[],
  opts: { apiUrl?: string; secret?: string; outDir: string; runId: string; fetchImpl?: FetchLike },
): Promise<string> {
  if (opts.apiUrl && opts.secret) {
    const fetchImpl = opts.fetchImpl ?? fetch;
    for (let i = 0; i < drafts.length; i += BATCH) {
      const res = await fetchImpl(`${opts.apiUrl.replace(/\/$/, "")}/api/internal/drafts`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${opts.secret}` },
        body: JSON.stringify({ drafts: drafts.slice(i, i + BATCH) }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) throw new Error(`ingest failed: HTTP ${res.status}`);
    }
    return `sent ${drafts.length} drafts to ${opts.apiUrl}`;
  }
  await mkdir(opts.outDir, { recursive: true });
  const file = join(opts.outDir, `drafts-${opts.runId}.json`);
  await writeFile(file, JSON.stringify(drafts, null, 2));
  return `wrote ${drafts.length} drafts to ${file}`;
}

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { providersFromEnv } from "./ai/providers.js";
import { Router } from "./ai/router.js";
import { run } from "./pipeline.js";
import { deliver } from "./sink.js";
import { SOURCES } from "./sources.js";
import { loadState, saveState } from "./state.js";

const env = process.env;
const now = new Date();
const runId = now.toISOString().replace(/[:.]/g, "-");
const outDir = env.OUT_DIR ?? "out";
const statePath = env.STATE_PATH ?? "state/state.json";

const only = env.SOURCES?.split(",").map((s) => s.trim());
const sources = only ? SOURCES.filter((s) => only.includes(s.id)) : SOURCES;

const providers = providersFromEnv(env);
const router = providers.length ? new Router(providers) : null;
console.log(`AI pool: ${providers.map((p) => `${p.id}(${p.model})`).join(", ") || "none — collecting raw items only"}`);

const state = await loadState(statePath);
const result = await run(sources, state, router, {
  now,
  maxItems: Number(env.MAX_ITEMS ?? 25),
  maxAgeDays: Number(env.MAX_AGE_DAYS ?? 45),
  force: env.FORCE === "1",
  log: console.log,
});

if (result.drafts.length) {
  console.log(await deliver(result.drafts, { apiUrl: env.GRANTCHI_API_URL, secret: env.GRANTCHI_INGEST_SECRET, outDir, runId }));
}
// Mark as seen only after delivery succeeded, so nothing is lost on a failed run.
for (const fp of result.processed) state.seen[fp] = now.toISOString().slice(0, 10);
await saveState(statePath, state, now);

await mkdir(outDir, { recursive: true });
if (result.pending.length) {
  await writeFile(join(outDir, `pending-${runId}.json`), JSON.stringify(result.pending, null, 2));
}
const summary = {
  runId,
  day: now.toISOString().slice(0, 10),
  stats: result.stats,
  pending: result.pending.length,
  sourceErrors: result.sourceErrors,
  aiUsage: Object.fromEntries(router?.usage ?? []),
};
await writeFile(join(outDir, `summary-${runId}.json`), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * What the collector remembers between runs: items already processed and
 * when each source was last checked. In GitHub Actions the file is kept with
 * actions/cache; once the Worker API exists it moves to D1 (sources.next_check_at).
 */
export interface State {
  seen: Record<string, string>; // fingerprint -> date first processed
  lastChecked: Record<string, string>; // source id -> ISO time
}

const KEEP_SEEN_DAYS = 180;

export async function loadState(path: string): Promise<State> {
  try {
    const s = JSON.parse(await readFile(path, "utf8")) as Partial<State>;
    return { seen: s.seen ?? {}, lastChecked: s.lastChecked ?? {} };
  } catch {
    return { seen: {}, lastChecked: {} };
  }
}

export async function saveState(path: string, state: State, now: Date): Promise<void> {
  const cutoff = new Date(now.getTime() - KEEP_SEEN_DAYS * 86_400_000).toISOString().slice(0, 10);
  for (const [k, d] of Object.entries(state.seen)) if (d < cutoff) delete state.seen[k];
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(state, null, 1));
}

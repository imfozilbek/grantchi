import type { FetchLike } from "../http.js";
import type { Provider } from "./providers.js";

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export interface Usage {
  requests: number;
  failures: number;
  rateLimited: number;
}

class ProviderError extends Error {
  constructor(
    message: string,
    /** The provider is unusable for the rest of the run (quota, bad key). */
    readonly exhausted: boolean,
  ) {
    super(message);
  }
}

/**
 * Sends a request to the first provider in the pool that is still usable.
 * Quota or auth errors take a provider out for the rest of the run;
 * other errors (5xx, timeouts, bad output) move to the next provider for this request only.
 * Usage is counted per provider for the run, one row per (provider, day) downstream.
 */
export class Router {
  readonly usage = new Map<string, Usage>();
  private readonly exhausted = new Set<string>();

  constructor(
    private readonly providers: Provider[],
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  get available(): boolean {
    return this.providers.some((p) => !this.exhausted.has(p.id));
  }

  /**
   * Returns the first answer that `accept` takes without throwing.
   * A rejected answer counts as a failure and the next provider is tried.
   */
  async complete<T>(messages: ChatMessage[], accept: (text: string) => T): Promise<{ value: T; provider: Provider }> {
    const errors: string[] = [];
    for (const p of this.providers) {
      if (this.exhausted.has(p.id)) continue;
      const u = this.usageOf(p.id);
      u.requests++;
      try {
        const text = await this.call(p, messages);
        return { value: accept(text), provider: p };
      } catch (e) {
        u.failures++;
        if (e instanceof ProviderError && e.exhausted) {
          this.exhausted.add(p.id);
          if (e.message.includes("429")) u.rateLimited++;
        }
        errors.push(`${p.id}: ${(e as Error).message}`);
      }
    }
    throw new Error(`all providers failed: ${errors.join("; ") || "no providers configured"}`);
  }

  private async call(p: Provider, messages: ChatMessage[]): Promise<string> {
    const res = await this.fetchImpl(`${p.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${p.apiKey}` },
      body: JSON.stringify({ model: p.model, messages, temperature: 0.2 }),
      signal: AbortSignal.timeout(90_000),
    });
    if (res.status === 429 || res.status === 401 || res.status === 403 || res.status === 402) {
      throw new ProviderError(`HTTP ${res.status}`, true);
    }
    if (!res.ok) throw new ProviderError(`HTTP ${res.status}`, false);
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new ProviderError("empty answer", false);
    return content;
  }

  private usageOf(id: string): Usage {
    let u = this.usage.get(id);
    if (!u) this.usage.set(id, (u = { requests: 0, failures: 0, rateLimited: 0 }));
    return u;
  }
}

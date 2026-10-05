/**
 * Free tiers of large providers. All of them speak the OpenAI-compatible
 * chat completions API, so one client covers the pool.
 * A provider is used only when its key is set. Models can be overridden with
 * <ID>_MODEL env vars, since free model line-ups change often.
 */
export interface Provider {
  id: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ProviderDef {
  id: string;
  keyEnv: string;
  baseUrl: string | ((env: Env) => string | null);
  model: string;
}

type Env = Record<string, string | undefined>;

const DEFS: ProviderDef[] = [
  { id: "gemini", keyEnv: "GEMINI_API_KEY", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
  { id: "groq", keyEnv: "GROQ_API_KEY", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { id: "cerebras", keyEnv: "CEREBRAS_API_KEY", baseUrl: "https://api.cerebras.ai/v1", model: "llama-3.3-70b" },
  { id: "mistral", keyEnv: "MISTRAL_API_KEY", baseUrl: "https://api.mistral.ai/v1", model: "mistral-small-latest" },
  { id: "github", keyEnv: "GH_MODELS_TOKEN", baseUrl: "https://models.github.ai/inference", model: "openai/gpt-4.1-mini" },
  { id: "openrouter", keyEnv: "OPENROUTER_API_KEY", baseUrl: "https://openrouter.ai/api/v1", model: "meta-llama/llama-3.3-70b-instruct:free" },
  // Last: its free quota is shared by all 5 projects on the Cloudflare account.
  {
    id: "workersai",
    keyEnv: "CLOUDFLARE_AI_TOKEN",
    baseUrl: (env) => (env.CLOUDFLARE_ACCOUNT_ID ? `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1` : null),
    model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  },
];

/** Providers with keys, in pool order. AI_PROVIDERS="groq,gemini" reorders or narrows the pool. */
export function providersFromEnv(env: Env = process.env): Provider[] {
  const order = env.AI_PROVIDERS?.split(",").map((s) => s.trim()).filter(Boolean);
  const defs = order ? order.map((id) => DEFS.find((d) => d.id === id)).filter((d): d is ProviderDef => !!d) : DEFS;
  const out: Provider[] = [];
  for (const d of defs) {
    const apiKey = env[d.keyEnv];
    const baseUrl = typeof d.baseUrl === "string" ? d.baseUrl : d.baseUrl(env);
    if (!apiKey || !baseUrl) continue;
    out.push({ id: d.id, baseUrl, apiKey, model: env[`${d.id.toUpperCase()}_MODEL`] ?? d.model });
  }
  return out;
}

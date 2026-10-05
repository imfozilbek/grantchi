const USER_AGENT = "GrantchiBot/0.1 (+https://grantchi.uz)";

export type FetchLike = typeof fetch;

export async function fetchText(url: string, opts: { timeoutMs?: number; fetchImpl?: FetchLike } = {}): Promise<string> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const res = await fetchImpl(url, {
    headers: { "user-agent": USER_AGENT, accept: "*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

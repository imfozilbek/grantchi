import { decide, listForModeration, requireModerator } from "./admin.js";
import { error, HttpError, json, type Env } from "./http.js";
import { checkIngestSecret, ingestDrafts, ingestUsage } from "./ingest.js";
import { runScheduled } from "./scheduled.js";

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method;

  // Collector (GitHub Actions), bearer secret.
  if (pathname.startsWith("/api/internal/")) {
    await checkIngestSecret(request, env);
    if (method === "POST" && pathname === "/api/internal/drafts") return json(await ingestDrafts(request, env));
    if (method === "POST" && pathname === "/api/internal/ai-usage") return json(await ingestUsage(request, env));
    return error(404, "not found");
  }

  // Moderation, behind Cloudflare Access.
  if (pathname.startsWith("/api/admin/")) {
    const moderator = await requireModerator(request, env);
    if (method === "GET" && pathname === "/api/admin/opportunities") return json(await listForModeration(url, env));
    const m = pathname.match(/^\/api\/admin\/opportunities\/(\d+)$/);
    if (method === "POST" && m) return json(await decide(Number(m[1]), request, env, moderator));
    if (method === "GET" && pathname === "/api/admin/me") return json({ email: moderator });
    return error(404, "not found");
  }

  return error(404, "not found");
}

export default {
  async fetch(request, env, _ctx): Promise<Response> {
    try {
      return await route(request, env);
    } catch (e) {
      if (e instanceof HttpError) return error(e.status, e.message);
      console.error(e);
      return error(500, "internal error");
    }
  },

  async scheduled(controller, env, _ctx): Promise<void> {
    const done = await runScheduled(controller.scheduledTime, env);
    if (done.length) console.log(`scheduled: ${done.join(", ")}`);
  },
} satisfies ExportedHandler<Env>;

import type { RawItem } from "../types.js";
import { htmlToText } from "./text.js";

interface DevpostHackathon {
  title: string;
  url: string;
  displayed_location?: { location?: string };
  submission_period_dates?: string;
  time_left_to_submission?: string;
  themes?: { name: string }[];
  prize_amount?: string;
  organization_name?: string | null;
  invite_only?: boolean;
}

/** Open hackathons from the Devpost JSON API. Invite-only ones are dropped. */
export function parseDevpost(json: string, sourceId: string): RawItem[] {
  const data = JSON.parse(json) as { hackathons?: DevpostHackathon[] };
  return (data.hackathons ?? [])
    .filter((h) => !h.invite_only)
    .map((h) => ({
      sourceId,
      url: h.url,
      title: h.title,
      text: [
        `Hackathon: ${h.title}`,
        h.organization_name ? `Organizer: ${h.organization_name}` : "",
        `Location: ${h.displayed_location?.location ?? "unknown"}`,
        `Submission period: ${h.submission_period_dates ?? "unknown"}`,
        h.time_left_to_submission ? `Time left: ${h.time_left_to_submission}` : "",
        h.prize_amount ? `Prizes: ${htmlToText(h.prize_amount)}` : "",
        h.themes?.length ? `Themes: ${h.themes.map((t) => t.name).join(", ")}` : "",
        `Official page: ${h.url}`,
      ]
        .filter(Boolean)
        .join("\n"),
      publishedAt: null,
    }));
}

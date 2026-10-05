import { parse } from "node-html-parser";
import type { RawItem } from "../types.js";
import { htmlToText } from "./text.js";

/** Posts from a public channel preview page (https://t.me/s/<channel>). */
export function parseTelegram(html: string, sourceId: string): RawItem[] {
  const root = parse(html);
  const items: RawItem[] = [];
  for (const msg of root.querySelectorAll(".tgme_widget_message[data-post]")) {
    const post = msg.getAttribute("data-post");
    const textEl = msg.querySelector(".tgme_widget_message_text");
    if (!post || !textEl) continue; // media-only posts carry nothing to read
    const text = htmlToText(textEl.innerHTML);
    const datetime = msg.querySelector("time[datetime]")?.getAttribute("datetime") ?? null;
    items.push({
      sourceId,
      url: `https://t.me/${post}`,
      title: text.split("\n")[0]?.slice(0, 200) ?? "",
      text,
      publishedAt: datetime ? new Date(datetime).toISOString() : null,
    });
  }
  return items;
}

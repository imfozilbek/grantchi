import { XMLParser } from "fast-xml-parser";
import type { RawItem } from "../types.js";
import { decodeEntities, htmlToText } from "./text.js";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", cdataPropName: false, processEntities: false });

type Node = Record<string, unknown>;

function str(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object" && "#text" in v) return str((v as Node)["#text"]);
  return "";
}

function list<T>(v: T | T[] | undefined): T[] {
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function toIso(date: string): string | null {
  const t = Date.parse(date);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

/** RSS 2.0 and Atom feeds. */
export function parseFeed(xml: string, sourceId: string): RawItem[] {
  const doc = parser.parse(xml) as Node;

  const rss = doc.rss as Node | undefined;
  if (rss) {
    const channel = rss.channel as Node;
    return list(channel.item as Node[] | Node | undefined).map((item) => {
      const html = str(item["content:encoded"]) || str(item.description);
      return {
        sourceId,
        url: str(item.link).trim(),
        title: decodeEntities(str(item.title)).trim(),
        text: htmlToText(html),
        publishedAt: toIso(str(item.pubDate)),
      };
    });
  }

  const feed = doc.feed as Node | undefined;
  if (feed) {
    return list(feed.entry as Node[] | Node | undefined).map((entry) => {
      const links = list(entry.link as Node[] | Node | undefined);
      const link = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? links[0];
      return {
        sourceId,
        url: str(link?.["@_href"]).trim(),
        title: decodeEntities(str(entry.title)).trim(),
        text: htmlToText(str(entry.content) || str(entry.summary)),
        publishedAt: toIso(str(entry.published) || str(entry.updated)),
      };
    });
  }

  throw new Error(`${sourceId}: not an RSS or Atom feed`);
}

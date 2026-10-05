import { parse, type HTMLElement } from "node-html-parser";

const DROP = "script, style, noscript, nav, header, footer, aside, form, iframe, svg, .sharedaddy, .jp-relatedposts, .related-posts, .comments-area";

/** Plain text of an HTML fragment, with paragraph breaks kept. */
export function htmlToText(html: string): string {
  const root = parse(html, { blockTextElements: { script: false, style: false } });
  root.querySelectorAll(DROP).forEach((el) => el.remove());
  return elementText(root);
}

function elementText(el: HTMLElement): string {
  const html = el.innerHTML
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n");
  const text = parse(html).textContent;
  return decodeEntities(text)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** Main text of an article page (WordPress and similar). */
export function extractArticleText(html: string, maxChars = 12_000): string {
  const root = parse(html, { blockTextElements: { script: false, style: false } });
  root.querySelectorAll(DROP).forEach((el) => el.remove());
  const main =
    root.querySelector(".entry-content") ??
    root.querySelector(".post-content") ??
    root.querySelector("article") ??
    root.querySelector("main") ??
    root.querySelector("body") ??
    root;
  return elementText(main).slice(0, maxChars);
}

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseDevpost } from "../src/parsers/devpost.js";
import { parseFeed } from "../src/parsers/rss.js";
import { parseTelegram } from "../src/parsers/telegram.js";
import { extractArticleText } from "../src/parsers/text.js";

const fixture = (name: string) => readFileSync(new URL(`fixtures/${name}`, import.meta.url), "utf8");

describe("parseFeed", () => {
  it("reads RSS items with decoded titles, text and dates", () => {
    const items = parseFeed(fixture("feed.xml"), "ex");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      sourceId: "ex",
      title: "Example Fellowship 2027 & Grant",
      url: "https://example.org/2026/10/03/example-fellowship/?utm_source=rss",
      publishedAt: "2026-10-03T16:25:31.000Z",
    });
    expect(items[0]!.text).toContain("Deadline: January 5, 2027");
  });

  it("prefers content:encoded and drops scripts", () => {
    const [, second] = parseFeed(fixture("feed.xml"), "ex");
    expect(second!.text).toBe("First paragraph.\nSecond bold paragraph.");
  });

  it("reads Atom entries", () => {
    expect(parseFeed(fixture("atom.xml"), "a")).toEqual([
      { sourceId: "a", url: "https://example.net/a", title: "Atom entry", text: "Short summary", publishedAt: "2026-10-01T00:00:00.000Z" },
    ]);
  });

  it("rejects non-feeds", () => {
    expect(() => parseFeed("<html></html>", "x")).toThrow(/not an RSS/);
  });
});

describe("parseTelegram", () => {
  it("reads text posts and skips media-only ones", () => {
    const items = parseTelegram(fixture("telegram.html"), "tg");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      url: "https://t.me/grantlar/100",
      title: "OECD Internship Programme: haq to'lanadigan amaliyot!",
      publishedAt: "2026-10-04T09:12:00.000Z",
    });
    expect(items[0]!.text).toContain("Muddat: 30-noyabr");
  });
});

describe("parseDevpost", () => {
  it("drops invite-only hackathons and flattens fields to text", () => {
    const items = parseDevpost(fixture("devpost.json"), "devpost");
    expect(items).toHaveLength(1);
    expect(items[0]!.text).toContain("Submission period: Aug 31 - Oct 23, 2026");
    expect(items[0]!.text).toContain("Prizes: $10,000");
  });
});

describe("extractArticleText", () => {
  it("takes the entry content and leaves out navigation", () => {
    const html = `<html><body><nav>Menu</nav><article><div class="entry-content"><p>Deadline: 1 May</p><p>Eligibility: all</p></div></article><footer>Footer</footer></body></html>`;
    expect(extractArticleText(html)).toBe("Deadline: 1 May\nEligibility: all");
  });
});

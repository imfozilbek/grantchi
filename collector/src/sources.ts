import type { Source } from "./types.js";

/**
 * Starting sources: the top 10 from docs/sources.md.
 * The full list of 97 is added here gradually, after each one is checked.
 */
export const SOURCES: Source[] = [
  // International aggregators (daily)
  { id: "opportunitydesk", name: "Opportunity Desk", kind: "rss", url: "https://opportunitydesk.org/feed/", everyHours: 6, fetchArticle: true },
  { id: "opportunitiesforyouth", name: "Opportunities for Youth", kind: "rss", url: "https://opportunitiesforyouth.org/feed/", everyHours: 6, fetchArticle: true },
  { id: "globalsouth", name: "Global South Opportunities", kind: "rss", url: "https://www.globalsouthopportunities.com/feed/", everyHours: 6, fetchArticle: true },
  { id: "profellow", name: "ProFellow", kind: "rss", url: "https://www.profellow.com/feed/", everyHours: 24, fetchArticle: true },

  // Uzbek sources
  { id: "grantlar", name: "Grantlar.uz", kind: "rss", url: "https://grantlar.uz/feed/", everyHours: 6, fetchArticle: true },
  { id: "tg-grantgouz", name: "GrantGO", kind: "telegram", url: "https://t.me/s/grantgouz", everyHours: 6 },
  { id: "tg-yoshlaragentligi", name: "Yoshlar ishlari agentligi", kind: "telegram", url: "https://t.me/s/yoshlaragentligi", everyHours: 12 },
  { id: "tg-eduuz", name: "Oliy ta'lim vazirligi", kind: "telegram", url: "https://t.me/s/eduuz", everyHours: 12 },

  // Official programmes
  { id: "usembassy-uz", name: "AQSh elchixonasi (Toshkent)", kind: "rss", url: "https://uz.usembassy.gov/feed/", everyHours: 24, fetchArticle: true },
  { id: "stipendiumhungaricum", name: "Stipendium Hungaricum", kind: "rss", url: "https://stipendiumhungaricum.hu/feed/", everyHours: 72, fetchArticle: true },
  { id: "osce-academy", name: "OSCE Academy Bishkek", kind: "rss", url: "https://osce-academy.net/feed/", everyHours: 72, fetchArticle: true },
  { id: "swedish-institute", name: "Swedish Institute", kind: "rss", url: "https://si.se/en/feed/", everyHours: 72, fetchArticle: true },

  // Competitions
  { id: "devpost", name: "Devpost", kind: "devpost", url: "https://devpost.com/api/hackathons?status[]=open&order_by=recently-added", everyHours: 24 },
];

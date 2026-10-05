import { z } from "zod";

export type SourceKind = "rss" | "telegram" | "devpost";

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  /** How often the source is worth checking. */
  everyHours: number;
  /** Fetch the item's page for full text (RSS feeds that only ship an excerpt). */
  fetchArticle?: boolean;
}

/** One post/item as found in a source, before any AI processing. */
export interface RawItem {
  sourceId: string;
  url: string;
  title: string;
  text: string;
  publishedAt: string | null;
}

export const OPPORTUNITY_TYPES = [
  "scholarship",
  "grant",
  "fellowship",
  "internship",
  "exchange",
  "competition",
  "hackathon",
  "olympiad",
  "conference",
  "summer_school",
  "course",
  "startup_program",
  "volunteering",
  "other",
] as const;

export const LEVELS = ["school", "bachelor", "master", "phd", "postdoc", "professional", "any"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** What the model must return for one item. */
export const CardSchema = z.object({
  is_opportunity: z.boolean(),
  skip_reason: z.string().nullish(),
  title_uz: z.string().min(3),
  summary_uz: z.string().min(10),
  type: z.enum(OPPORTUNITY_TYPES),
  levels: z.array(z.enum(LEVELS)),
  fields_uz: z.array(z.string()),
  host_countries: z.array(z.string()),
  eligibility: z.enum(["all", "uzbekistan_eligible", "not_eligible", "unknown"]),
  funding: z.enum(["full", "partial", "none", "unknown"]),
  funding_details_uz: z.string().nullish(),
  deadline: isoDate.nullable(),
  deadline_text: z.string().nullish(),
  requirements_uz: z.array(z.string()),
  documents_uz: z.array(z.string()),
  official_url: z.string().url().nullable(),
  confidence: z.number().min(0).max(1),
});

export type Card = z.infer<typeof CardSchema>;

/** A card ready for moderation: model output plus where it came from. */
export interface Draft {
  fingerprint: string;
  sourceId: string;
  sourceUrl: string;
  sourcePublishedAt: string | null;
  collectedAt: string;
  provider: string;
  model: string;
  needsCheck: string[];
  card: Card;
}

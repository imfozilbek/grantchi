import { CardSchema, LEVELS, OPPORTUNITY_TYPES, type Card, type RawItem } from "../types.js";
import type { ChatMessage } from "./router.js";

const MAX_INPUT_CHARS = 10_000;

export function cardMessages(item: RawItem, today: string): ChatMessage[] {
  const system = `You turn one post about an opportunity (scholarship, grant, competition, etc.) into a structured card for young people in Uzbekistan.
Today is ${today}.

Rules:
- Use only facts present in the post. Never invent dates, amounts, countries or requirements. If a fact is missing, use null, "unknown" or an empty list.
- All *_uz fields are written in Uzbek, Latin script, in your own words (rewrite, do not copy sentences). Keep official programme names as they are.
- summary_uz: 2-4 sentences: what it is, who can apply, what is offered.
- requirements_uz: who can apply and what is required, one short item each.
- documents_uz: checklist of documents to prepare, one item each, only if the post lists them.
- deadline: the application deadline as YYYY-MM-DD, or null if not stated. If several rounds, the nearest future one. deadline_text: the deadline as written in the post.
- host_countries: ISO 3166-1 alpha-2 codes of where it takes place; "ONLINE" if online.
- eligibility: "all" if open to all nationalities, "uzbekistan_eligible" if Uzbekistan / Central Asia / CIS / developing countries are explicitly eligible, "not_eligible" if Uzbek citizens cannot apply, else "unknown".
- official_url: the organiser's official page or application link from the post, or null. Never the aggregator's own page.
- is_opportunity: false for news, results, reports, ads, job vacancies at regular companies, or posts without anything to apply for. Then set skip_reason and fill the other fields minimally.
- confidence: 0..1, how sure you are that the card is complete and correct.

Answer with one JSON object only, no markdown, with exactly these keys:
is_opportunity (boolean), skip_reason (string|null), title_uz, summary_uz,
type (one of: ${OPPORTUNITY_TYPES.join(", ")}),
levels (array of: ${LEVELS.join(", ")}),
fields_uz (array of strings), host_countries (array), eligibility, funding (full|partial|none|unknown),
funding_details_uz (string|null), deadline, deadline_text (string|null), requirements_uz (array), documents_uz (array),
official_url (string|null), confidence (number).`;

  const user = `Source URL: ${item.url}
Published: ${item.publishedAt ?? "unknown"}
Title: ${item.title}

${item.text.slice(0, MAX_INPUT_CHARS)}`;

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** Parses and validates the model's answer. Throws on anything that is not a valid card. */
export function parseCard(text: string): Card {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object in answer");
  const json: unknown = JSON.parse(text.slice(start, end + 1));
  const result = CardSchema.safeParse(json);
  if (!result.success) throw new Error(`invalid card: ${result.error.issues.map((i) => i.path.join(".")).join(", ")}`);
  return result.data;
}

/** Why a moderator should look closer. Empty means the card looks complete. */
export function needsCheck(card: Card): string[] {
  const reasons: string[] = [];
  if (!card.deadline) reasons.push("no_deadline");
  if (!card.official_url) reasons.push("no_official_url");
  if (card.eligibility === "unknown") reasons.push("eligibility_unknown");
  if (card.confidence < 0.6) reasons.push("low_confidence");
  return reasons;
}

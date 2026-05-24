import { Paper } from "@/types/paper";
import { resolveCountryCode } from "./country";
import { isAfricanPaper } from "./africa-filter";

export const RUSSIA_EASTERN_EUROPE_COUNTRY_CODES = new Set([
  "RU",
  "BY",
  "UA",
  "PL",
  "CZ",
  "SK",
  "HU",
  "RO",
  "BG",
  "RS",
  "HR",
  "SI",
  "BA",
  "MK",
  "AL",
  "ME",
  "MD",
  "LT",
  "LV",
  "EE",
  "GE",
  "AM",
  "AZ",
  "XK",
]);

const RUSSIA_EASTERN_EUROPE_TEXT_PATTERNS: RegExp[] = [
  /\brussia\b/i,
  /\brussian\b/i,
  /\bmoscow\b/i,
  /\bukraine\b/i,
  /\bukrainian\b/i,
  /\bbelarus\b/i,
  /\bbelarusian\b/i,
  /\beastern europe\b/i,
  /\beastern european\b/i,
  /\bcentral and eastern europe\b/i,
  /\bcee\b/i,
  /\bbaltic states\b/i,
  /\bbalkans\b/i,
  /\bbalkan\b/i,
  /\bpoland\b/i,
  /\bpolish\b/i,
  /\bczech\b/i,
  /\bczechia\b/i,
  /\bhungary\b/i,
  /\bhungarian\b/i,
  /\bromania\b/i,
  /\bromanian\b/i,
  /\bbulgaria\b/i,
  /\bbulgarian\b/i,
  /\bserbia\b/i,
  /\bserbian\b/i,
  /\bcroatia\b/i,
  /\bcroatian\b/i,
  /\bslovenia\b/i,
  /\bslovenian\b/i,
  /\bbosnia\b/i,
  /\bmacedonia\b/i,
  /\bkosovo\b/i,
  /\bmoldova\b/i,
  /\blithuania\b/i,
  /\blatvia\b/i,
  /\bestonia\b/i,
  /\bkyiv\b/i,
  /\bkiev\b/i,
  /\bwarsaw\b/i,
  /\bbudapest\b/i,
  /\bbucharest\b/i,
  /\bprague\b/i,
  /\bsoviet\b/i,
  /\bpost-soviet\b/i,
];

export function isRussiaEasternEuropePaper(
  paper: Pick<Paper, "title" | "abstract" | "journal" | "countryCode">
): boolean {
  const countryCode = resolveCountryCode(paper)?.toUpperCase();
  if (countryCode && RUSSIA_EASTERN_EUROPE_COUNTRY_CODES.has(countryCode)) {
    return true;
  }

  const text = `${paper.title} ${paper.abstract} ${paper.journal}`;
  return RUSSIA_EASTERN_EUROPE_TEXT_PATTERNS.some((pattern) =>
    pattern.test(text)
  );
}

export function isExcludedRegionPaper(
  paper: Pick<Paper, "title" | "abstract" | "journal" | "countryCode">
): boolean {
  return isAfricanPaper(paper) || isRussiaEasternEuropePaper(paper);
}

export function filterExcludedRegionPapers<T extends Paper>(papers: T[]): T[] {
  return papers.filter((paper) => !isExcludedRegionPaper(paper));
}

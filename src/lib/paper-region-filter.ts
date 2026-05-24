import { Paper } from "@/types/paper";
import { resolveCountryCode } from "./country";
import { isAfricanPaper } from "./africa-filter";
import { isNonInvestmentPensionPaper, isOffTopicPaper } from "./non-investment-pension-filter";

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

export const EXCLUDED_ASIA_PENSION_COUNTRY_CODES = new Set(["CN", "MY"]);

const EXCLUDED_ASIA_PENSION_TEXT_PATTERNS: RegExp[] = [
  /\bchina\b/i,
  /\bchinese\b/i,
  /\bchina pension\b/i,
  /\bchinese pension\b/i,
  /\bnational social security fund china\b/i,
  /\bmalaysia\b/i,
  /\bmalaysian\b/i,
  /\bmalaysia pension\b/i,
  /\bepf malaysia\b/i,
  /\bkwsp\b/i,
  /\bemployees provident fund malaysia\b/i,
];

export function isExcludedAsiaPensionPaper(
  paper: Pick<Paper, "title" | "abstract" | "journal" | "countryCode">
): boolean {
  const countryCode = resolveCountryCode(paper)?.toUpperCase();
  if (countryCode && EXCLUDED_ASIA_PENSION_COUNTRY_CODES.has(countryCode)) {
    return true;
  }

  const text = `${paper.title} ${paper.abstract} ${paper.journal}`;
  if (!/(pension|retirement|provident fund|연금|연기금)/i.test(text)) {
    return false;
  }

  return EXCLUDED_ASIA_PENSION_TEXT_PATTERNS.some((pattern) =>
    pattern.test(text)
  );
}

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
  return (
    isAfricanPaper(paper) ||
    isRussiaEasternEuropePaper(paper) ||
    isExcludedAsiaPensionPaper(paper)
  );
}

export function isIngestExcludedPaper(
  paper: Pick<Paper, "title" | "abstract" | "journal" | "countryCode">
): boolean {
  return (
    isExcludedRegionPaper(paper) ||
    isNonInvestmentPensionPaper(paper) ||
    isOffTopicPaper(paper)
  );
}

export function filterExcludedRegionPapers<T extends Paper>(papers: T[]): T[] {
  return papers.filter((paper) => !isIngestExcludedPaper(paper));
}

export function filterIngestPapers<T extends Paper>(papers: T[]): T[] {
  return filterExcludedRegionPapers(papers);
}

import { Paper } from "@/types/paper";
import { resolveCountryCode } from "./country";

/** South Asia (Singapore SG는 우선 지역 — 제외하지 않음) */
export const SOUTH_ASIA_COUNTRY_CODES = new Set([
  "AF",
  "BD",
  "BT",
  "IN",
  "IR",
  "LK",
  "MV",
  "NP",
  "PK",
]);

export const LATIN_AMERICA_COUNTRY_CODES = new Set([
  "AR",
  "BO",
  "BR",
  "CL",
  "CO",
  "CR",
  "CU",
  "DO",
  "EC",
  "SV",
  "GT",
  "HN",
  "MX",
  "NI",
  "PA",
  "PY",
  "PE",
  "PR",
  "UY",
  "VE",
  "BZ",
  "GY",
  "SR",
  "GF",
  "HT",
  "JM",
  "TT",
  "BB",
]);

const SOUTH_ASIA_TEXT_PATTERNS: RegExp[] = [
  /\bsouth asia\b/i,
  /\bsouth asian\b/i,
  /\bindia\b/i,
  /\bindian\b/i,
  /\bpakistan\b/i,
  /\bpakistani\b/i,
  /\bbangladesh\b/i,
  /\bbangladeshi\b/i,
  /\bsri lanka\b/i,
  /\bnepal\b/i,
  /\bnepalese\b/i,
  /\bafghanistan\b/i,
  /\bafghan\b/i,
  /\bmumbai\b/i,
  /\bdelhi\b/i,
  /\bbangalore\b/i,
  /\bkarachi\b/i,
  /\bdhaka\b/i,
];

const LATIN_AMERICA_TEXT_PATTERNS: RegExp[] = [
  /\blatin america\b/i,
  /\blatin american\b/i,
  /\bsouth america\b/i,
  /\bsouth american\b/i,
  /\bbrazil\b/i,
  /\bbrazilian\b/i,
  /\bmexico\b/i,
  /\bmexican\b/i,
  /\bargentina\b/i,
  /\bargentine\b/i,
  /\bchile\b/i,
  /\bchilean\b/i,
  /\bcolombia\b/i,
  /\bcolombian\b/i,
  /\bperu\b/i,
  /\bperuvian\b/i,
  /\bvenezuela\b/i,
  /\becuador\b/i,
  /\bbuenos aires\b/i,
  /\bsao paulo\b/i,
  /\brio de janeiro\b/i,
  /\bmexico city\b/i,
  /\bbogota\b/i,
  /\blima\b/i,
  /\bsantiago\b/i,
];

export function isSouthAsiaPaper(
  paper: Pick<Paper, "title" | "abstract" | "journal" | "countryCode">
): boolean {
  const countryCode = resolveCountryCode(paper)?.toUpperCase();
  if (countryCode && SOUTH_ASIA_COUNTRY_CODES.has(countryCode)) {
    return true;
  }

  const text = `${paper.title} ${paper.abstract} ${paper.journal}`;
  if (/\bsingapore\b/i.test(text)) return false;

  return SOUTH_ASIA_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function isLatinAmericaPaper(
  paper: Pick<Paper, "title" | "abstract" | "journal" | "countryCode">
): boolean {
  const countryCode = resolveCountryCode(paper)?.toUpperCase();
  if (countryCode && LATIN_AMERICA_COUNTRY_CODES.has(countryCode)) {
    return true;
  }

  const text = `${paper.title} ${paper.abstract} ${paper.journal}`;
  return LATIN_AMERICA_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

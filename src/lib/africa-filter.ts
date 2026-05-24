import { Paper } from "@/types/paper";
import { inferCountryFromText, resolveCountryCode } from "./country";

export const AFRICAN_COUNTRY_CODES = new Set([
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CV",
  "CM",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
]);

const AFRICAN_TEXT_PATTERNS: RegExp[] = [
  /\bafrica\b/i,
  /\bafrican\b/i,
  /\bsub-?saharan\b/i,
  /\b(kenya|kenyan)\b/i,
  /\b(nigeria|nigerian)\b/i,
  /\b(south africa|south african)\b/i,
  /\b(egypt|egyptian)\b/i,
  /\b(ghana|ghanaian)\b/i,
  /\b(ethiopia|ethiopian)\b/i,
  /\b(morocco|moroccan)\b/i,
  /\b(tanzania|tanzanian)\b/i,
  /\b(uganda|ugandan)\b/i,
  /\b(zambia|zambian)\b/i,
  /\b(zimbabwe|zimbabwean)\b/i,
  /\b(cote d.?ivoire|ivory coast)\b/i,
  /\b(nairobi)\b/i,
  /\b(lagos)\b/i,
  /\b(johannesburg)\b/i,
];

export function isAfricanPaper(paper: Pick<Paper, "title" | "abstract" | "journal" | "countryCode">): boolean {
  const countryCode = resolveCountryCode(paper)?.toUpperCase();
  if (countryCode && AFRICAN_COUNTRY_CODES.has(countryCode)) {
    return true;
  }

  const text = `${paper.title} ${paper.abstract} ${paper.journal}`;
  return AFRICAN_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function filterOutAfricanPapers<T extends Paper>(papers: T[]): T[] {
  return papers.filter((paper) => !isAfricanPaper(paper));
}

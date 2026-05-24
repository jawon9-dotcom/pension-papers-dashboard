import { Paper } from "@/types/paper";
import { isKoreanText } from "./title-ko";
import { isKoreaNpsNews } from "./korea-regions";

export const GLOBAL_PENSION_TREND_TERMS = [
  "calpers",
  "calstrs",
  "cppib",
  "ontario teachers",
  "cdpq",
  "otpp",
  "nbim",
  "gpif",
  "australiansuper",
  "nz super",
  "global pension",
  "public pension fund",
  "sovereign pension",
  "pension fund private equity",
  "pension fund alternative",
  "pension fund infrastructure",
  "pension fund real estate",
  "pension fund hedge fund",
  "alternative investment pension",
  "private equity pension fund",
  "factor based asset allocation",
  "factor investing pension",
  "factor allocation pension",
  "strategic asset allocation pension",
  "tactical asset allocation pension",
  "total portfolio approach",
  "reference portfolio",
  "institutional investor pension",
  "asset owner pension",
];

export const GLOBAL_PENSION_TREND_NEWS_SEARCHES = [
  "pension fund private equity allocation",
  "pension fund alternative investment strategy",
  "pension fund infrastructure investment",
  "pension fund real assets allocation",
  "global pension fund alternatives",
  "public pension fund private equity",
  "pension fund factor investing",
  "factor based asset allocation pension fund",
  "pension fund hedge fund allocation",
  "institutional pension private markets",
  "pension fund co-investment",
  "pension fund secondaries private equity",
  "calpers private equity",
  "cppib alternative investment",
  "ontario teachers private equity",
  "gpif alternative investment",
  "pension fund real estate allocation",
  "pension fund venture capital",
  "pension fund credit allocation",
  "sovereign pension fund portfolio strategy",
];

export const GLOBAL_GOOGLE_NEWS_RSS_SEARCHES = [
  { query: "pension+fund+private+equity", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+alternative+investment", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+infrastructure+investment", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "global+pension+fund+portfolio", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "factor+based+asset+allocation+pension", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+factor+investing", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "calpers+investment+strategy", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "cppib+portfolio+strategy", hl: "en-US", gl: "CA", ceid: "CA:en" },
  { query: "pension+fund+real+assets", hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { query: "institutional+pension+private+equity", hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { query: "pension+fund+asset+allocation", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "public+pension+fund+alternatives", hl: "en-US", gl: "US", ceid: "US:en" },
];

export const GLOBAL_TREND_OPENALEX_QUERIES = [
  { filter: "title.search:pension fund private equity", mode: "global-trend" as const },
  { filter: "title.search:pension fund alternative investment", mode: "global-trend" as const },
  { filter: "title.search:pension fund infrastructure investment", mode: "global-trend" as const },
  { filter: "title.search:factor based asset allocation pension", mode: "global-trend" as const },
  { filter: "title.search:pension fund real assets allocation", mode: "global-trend" as const },
  { filter: "default.search:private equity pension fund allocation", mode: "global-trend" as const },
  { filter: "default.search:alternative investment public pension fund", mode: "global-trend" as const },
  { filter: "default.search:factor investing pension portfolio", mode: "global-trend" as const },
  { filter: "default.search:pension fund hedge fund allocation", mode: "global-trend" as const },
  { filter: "default.search:global pension fund private markets", mode: "global-trend" as const },
];

export const GLOBAL_TREND_CROSSREF_QUERIES = [
  { query: "pension fund private equity allocation", mode: "global-trend" as const },
  { query: "pension fund alternative investment portfolio", mode: "global-trend" as const },
  { query: "pension fund infrastructure real assets", mode: "global-trend" as const },
  { query: "factor based asset allocation pension fund", mode: "global-trend" as const },
  { query: "journal alternative investments pension fund", mode: "global-trend" as const },
  { query: "public pension fund private equity", mode: "global-trend" as const },
  { query: "institutional pension alternative assets", mode: "global-trend" as const },
  { query: "pension fund factor investing strategy", mode: "global-trend" as const },
];

export function hasGlobalPensionTrendSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  return GLOBAL_PENSION_TREND_TERMS.some((term) =>
    normalized.includes(term.toLowerCase())
  );
}

export function isKoreaDomesticNews(
  paper: Pick<Paper, "title" | "abstract" | "countryCode">
): boolean {
  const text = `${paper.title} ${paper.abstract}`;
  if (hasGlobalPensionTrendSignal(text)) return false;
  if (isKoreaNpsNews(paper)) return true;
  if (isKoreanText(text) && /연금|연기금|퇴직/.test(text)) return true;
  return false;
}

export function isGlobalPensionNews(
  paper: Pick<Paper, "title" | "abstract" | "originalUrl" | "countryCode">
): boolean {
  const text = `${paper.title} ${paper.abstract}`;
  if (hasGlobalPensionTrendSignal(text)) return true;
  if (isKoreaDomesticNews(paper)) return false;
  return !isKoreanText(paper.title);
}

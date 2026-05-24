import { Paper } from "@/types/paper";
import { isKoreanText } from "./title-ko";

export const KOREA_PENSION_TERMS = [
  "국민연금",
  "국민연금공단",
  "국민연금기금",
  "한국연금",
  "공적연금",
  "퇴직연금",
  "national pension service",
  "korea national pension",
  "korean national pension",
  "south korea pension",
  "korea pension fund",
  "korean pension fund",
  "korea public pension",
  "nps korea",
  "nps fund korea",
  "nps asset allocation",
  "nps investment",
];

export const KOREA_OPENALEX_QUERIES = [
  {
    filter: "title.search:national pension service korea",
    mode: "korea" as const,
  },
  {
    filter: "title.search:korea pension fund asset allocation",
    mode: "korea" as const,
  },
  {
    filter: "title.search:korean pension investment",
    mode: "korea" as const,
  },
  {
    filter: "default.search:national pension service asset allocation",
    mode: "korea" as const,
  },
  {
    filter: "default.search:south korea pension fund portfolio",
    mode: "korea" as const,
  },
  {
    filter: "default.search:korea public pension fund investment",
    mode: "korea" as const,
  },
  {
    filter:
      "default.search:pension fund asset allocation,authorships.institutions.country_code:kr",
    mode: "korea" as const,
  },
  {
    filter:
      "default.search:pension investment strategy,authorships.institutions.country_code:kr",
    mode: "korea" as const,
  },
  {
    filter:
      "title.search:pension fund,authorships.institutions.country_code:kr",
    mode: "korea" as const,
  },
  {
    filter:
      "default.search:retirement pension fund,authorships.institutions.country_code:kr",
    mode: "korea" as const,
  },
];

export const KOREA_CROSSREF_QUERIES = [
  { query: "national pension service korea asset allocation", mode: "korea" as const },
  { query: "korea pension fund investment strategy", mode: "korea" as const },
  { query: "korean public pension fund portfolio", mode: "korea" as const },
  { query: "south korea pension fund asset management", mode: "korea" as const },
  { query: "korea national pension fund investment", mode: "korea" as const },
  { query: "nps korea pension fund", mode: "korea" as const },
  { query: "korea pension asset allocation strategic", mode: "korea" as const },
  { query: "korean pension risk management", mode: "korea" as const },
];

export const KOREA_NPS_NEWS_SEARCHES = [
  "국민연금 자산배분",
  "국민연금 투자전략",
  "국민연금 해외투자",
  "국민연금 수익률",
  "국민연금 ESG",
  "국민연금 기금운용",
  "국민연금 운용사",
  "국민연금 포트폴리오",
  "국민연금 주식투자",
  "국민연금 대체투자",
  "국민연금기금 운용",
  "national pension service korea investment",
  "NPS korea asset allocation",
  "korea national pension fund portfolio",
  "south korea pension fund investment strategy",
];

export const KOREA_GOOGLE_NEWS_RSS_SEARCHES = [
  { query: encodeURIComponent("국민연금+자산배분"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+투자+전략"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+해외투자"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+수익률"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+ESG"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+기금운용"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+운용사"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+포트폴리오"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("연기금+포트폴리오+운용"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: "national+pension+service+korea+investment", hl: "en-US", gl: "KR", ceid: "KR:en" },
  { query: "NPS+korea+pension+fund", hl: "en-US", gl: "KR", ceid: "KR:en" },
  { query: "korea+national+pension+asset+allocation", hl: "en-US", gl: "KR", ceid: "KR:en" },
];

export function hasKoreaPensionSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  if (KOREA_PENSION_TERMS.some((term) => normalized.includes(term.toLowerCase()))) {
    return true;
  }
  if (isKoreanText(text) && /연금|연기금|퇴직/.test(text)) {
    return true;
  }
  if (
    /\bnps\b/.test(normalized) &&
    (normalized.includes("korea") ||
      normalized.includes("korean") ||
      normalized.includes("national pension"))
  ) {
    return true;
  }
  return false;
}

export function isKoreaNpsNews(paper: Pick<Paper, "title" | "abstract" | "countryCode">): boolean {
  const text = `${paper.title} ${paper.abstract}`;
  if (text.includes("국민연금")) return true;
  if (paper.countryCode?.toUpperCase() === "KR" && hasKoreaPensionSignal(text)) {
    return true;
  }
  const normalized = text.toLowerCase();
  return (
    /\bnps\b/.test(normalized) &&
    (normalized.includes("korea") || normalized.includes("national pension"))
  );
}

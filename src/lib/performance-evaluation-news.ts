import { Paper } from "@/types/paper";

export const PERFORMANCE_NEWS_MAX = 10;
export const PERFORMANCE_NEWS_GLOBAL_RATIO = 4;
export const PERFORMANCE_NEWS_KOREA_RATIO = 1;
export const MAX_PERFORMANCE_NEWS_PER_FUND = 2;

export const GLOBAL_PENSION_FUND_NAMES = [
  "calpers",
  "calstrs",
  "cppib",
  "cdpq",
  "otpp",
  "ontario teachers",
  "gpif",
  "nbim",
  "australiansuper",
  "nz super",
  "florida sba",
  "texas teachers",
  "new york state common",
  "nycers",
  "psers",
  "apg",
  "pggm",
  "abp",
  "kic",
  "temasek",
  "gic",
  "public pension fund",
  "sovereign pension",
  "global pension fund",
];

export const PERFORMANCE_EVALUATION_NEWS_SEARCHES = [
  "pension fund investment performance",
  "pension fund annual return",
  "pension fund benchmark performance",
  "pension fund performance attribution",
  "public pension fund returns",
  "global pension fund performance",
  "pension fund performance review",
  "pension fund manager evaluation",
  "pension fund excess return",
  "pension fund tracking error",
  "calpers investment return",
  "calpers annual return",
  "calstrs investment return",
  "cppib investment performance",
  "ontario teachers pension return",
  "otpp investment performance",
  "cdpq pension fund return",
  "gpif investment performance",
  "nbim fund performance",
  "australiansuper investment return",
  "nz super fund performance",
  "sovereign pension fund return",
  "institutional pension performance benchmark",
  "public pension fund annual report returns",
  "teachers retirement system return",
  "state pension fund investment return",
  "pension fund posts return",
  "국민연금 수익률",
  "국민연금 운용성과",
  "국민연금 성과평가",
  "국민연금 기금성과",
  "national pension service korea return",
  "NPS korea fund performance",
];

export const PERFORMANCE_GLOBAL_GOOGLE_RSS_SEARCHES = [
  { query: "pension+fund+investment+performance", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+annual+return", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+benchmark+performance", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "public+pension+fund+returns", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "global+pension+fund+performance", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+performance+attribution", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "calpers+investment+return", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "calstrs+investment+performance", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "cppib+investment+performance", hl: "en-CA", gl: "CA", ceid: "CA:en" },
  { query: "ontario+teachers+pension+return", hl: "en-CA", gl: "CA", ceid: "CA:en" },
  { query: "gpif+investment+performance", hl: "en-US", gl: "JP", ceid: "JP:en" },
  { query: "nbim+fund+performance", hl: "en-GB", gl: "NO", ceid: "NO:en" },
  { query: "australiansuper+investment+return", hl: "en-AU", gl: "AU", ceid: "AU:en" },
  { query: "sovereign+pension+fund+return", hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { query: "institutional+pension+performance+benchmark", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "public+pension+fund+annual+return", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "teachers+retirement+system+investment+return", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "state+pension+fund+returns", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+posts+return", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+investment+results", hl: "en-GB", gl: "GB", ceid: "GB:en" },
];

export const PERFORMANCE_KOREA_GOOGLE_RSS_SEARCHES = [
  { query: encodeURIComponent("국민연금+수익률"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+운용성과"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+성과평가"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+기금+수익률"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: "national+pension+service+korea+return", hl: "en-US", gl: "KR", ceid: "KR:en" },
  { query: "NPS+korea+fund+performance", hl: "en-US", gl: "KR", ceid: "KR:en" },
];

const RETIREMENT_PENSION_EXCLUDE_PATTERNS: RegExp[] = [
  /퇴직연금/,
  /퇴직\s*연금/,
  /dc형\s*퇴직/,
  /확정기여형/,
  /확정급여형\s*퇴직/,
  /기업\s*퇴직연금/,
  /\birp\b/i,
  /defined contribution plan/i,
  /defined contribution pension/i,
  /corporate retirement plan/i,
  /employer-sponsored retirement/i,
  /401\s*\(\s*k\s*\)/i,
  /occupational pension scheme/i,
  /personal pension plan/i,
];

const PERFORMANCE_SIGNAL_TERMS = [
  "performance evaluation",
  "performance attribution",
  "fund performance",
  "investment performance",
  "investment return",
  "investment returns",
  "annual return",
  "annual returns",
  "rate of return",
  "returns report",
  "excess return",
  "tracking error",
  "peer group",
  "peer comparison",
  "manager evaluation",
  "performance review",
  "portfolio return",
  "portfolio performance",
  "underperformance",
  "outperformance",
  "benchmark comparison",
  "benchmark performance",
  "수익률",
  "운용성과",
  "성과평가",
  "기금성과",
  "성과 평가",
  "벤치마크 대비",
  "초과수익",
  "운용 실적",
];

const RETURN_SIGNAL_TERMS = [
  "return",
  "returns",
  "posted",
  "gained",
  "lost",
  "percent",
  "annual",
  "benchmark",
  "outperformed",
  "underperformed",
  "investment results",
  "investment performance",
  "수익률",
  "운용성과",
  "성과",
  "실적",
  "벤치마크",
];

const INSTITUTIONAL_PENSION_CONTEXT_TERMS = [
  "pension fund",
  "public pension",
  "national pension",
  "sovereign pension",
  "superannuation fund",
  "provident fund",
  ...GLOBAL_PENSION_FUND_NAMES,
  "asset owner",
  "institutional investor",
  "국민연금",
  "공적연금",
];

export function isExcludedRetirementPensionNews(
  title: string,
  description: string
): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return RETIREMENT_PENSION_EXCLUDE_PATTERNS.some((pattern) => pattern.test(text));
}

export function hasPerformanceEvaluationNewsSignal(
  title: string,
  text: string
): boolean {
  const titleLower = title.toLowerCase();
  const normalized = text.toLowerCase();

  return PERFORMANCE_SIGNAL_TERMS.some(
    (term) => normalized.includes(term) || titleLower.includes(term)
  );
}

export function mentionsGlobalPensionFund(text: string): boolean {
  const normalized = text.toLowerCase();
  return GLOBAL_PENSION_FUND_NAMES.some((term) => normalized.includes(term));
}

function hasReturnOrPerformanceLooseSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    RETURN_SIGNAL_TERMS.some((term) => normalized.includes(term)) ||
    hasPerformanceEvaluationNewsSignal("", normalized)
  );
}

export function getPerformanceNewsFundKey(title: string, description: string): string {
  const text = normalizeFundLookupText(`${title} ${description}`);

  if (text.includes("국민연금") || text.includes("national pension service")) {
    return "nps-korea";
  }

  for (const fund of GLOBAL_PENSION_FUND_NAMES) {
    if (text.includes(fund)) return fund;
  }

  if (text.includes("public pension")) return "public-pension";
  if (text.includes("pension fund")) return "pension-fund";

  return normalizeFundLookupText(title).slice(0, 48) || "general";
}

function normalizeFundLookupText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isPerformanceEvaluationNewsCandidate(
  title: string,
  description: string
): boolean {
  if (isExcludedRetirementPensionNews(title, description)) {
    return false;
  }

  const text = `${title} ${description}`.toLowerCase();

  if (isGlobalInstitutionalPensionPerformanceNews(title, description)) {
    return true;
  }

  if (mentionsGlobalPensionFund(text) && hasReturnOrPerformanceLooseSignal(text)) {
    return true;
  }

  if (!hasPerformanceEvaluationNewsSignal(title, text)) return false;

  return INSTITUTIONAL_PENSION_CONTEXT_TERMS.some((term) => text.includes(term));
}

export function isGlobalInstitutionalPensionPerformanceNews(
  title: string,
  description: string
): boolean {
  const text = `${title} ${description}`.toLowerCase();
  if (isExcludedRetirementPensionNews(title, description)) return false;

  return (
    mentionsGlobalPensionFund(text) &&
    hasReturnOrPerformanceLooseSignal(text)
  );
}

export function diversifyPerformanceNewsByFund<T extends Paper>(
  papers: T[],
  maxPerFund = MAX_PERFORMANCE_NEWS_PER_FUND
): T[] {
  const fundCounts = new Map<string, number>();
  const result: T[] = [];

  for (const paper of papers) {
    const fundKey = getPerformanceNewsFundKey(paper.title, paper.abstract);
    const count = fundCounts.get(fundKey) ?? 0;
    if (count >= maxPerFund) continue;
    fundCounts.set(fundKey, count + 1);
    result.push(paper);
  }

  return result;
}

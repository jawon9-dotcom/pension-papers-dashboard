export const PERFORMANCE_NEWS_MAX = 25;
export const PERFORMANCE_NEWS_GLOBAL_RATIO = 4;
export const PERFORMANCE_NEWS_KOREA_RATIO = 1;

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
  "국민연금 수익률",
  "국민연금 운용성과",
  "국민연금 성과평가",
  "국민연금 기금성과",
  "공적연금 수익률",
  "national pension service korea return",
  "NPS korea fund performance",
  "korea national pension fund return",
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

const INSTITUTIONAL_PENSION_CONTEXT_TERMS = [
  "pension fund",
  "public pension",
  "national pension",
  "sovereign pension",
  "superannuation fund",
  "provident fund",
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
  "asset owner",
  "institutional investor",
  "국민연금",
  "공적연금",
  "연기금",
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

export function isPerformanceEvaluationNewsCandidate(
  title: string,
  description: string
): boolean {
  if (isExcludedRetirementPensionNews(title, description)) {
    return false;
  }

  const text = `${title} ${description}`.toLowerCase();

  if (!hasPerformanceEvaluationNewsSignal(title, text)) return false;

  return INSTITUTIONAL_PENSION_CONTEXT_TERMS.some((term) => text.includes(term));
}

export function isGlobalInstitutionalPensionPerformanceNews(
  title: string,
  description: string
): boolean {
  const text = `${title} ${description}`.toLowerCase();
  if (isExcludedRetirementPensionNews(title, description)) return false;

  const globalFundTerms = [
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
    "public pension fund",
    "global pension",
    "sovereign pension",
    "sovereign wealth",
  ];

  return (
    hasPerformanceEvaluationNewsSignal(title, text) &&
    globalFundTerms.some((term) => text.includes(term))
  );
}

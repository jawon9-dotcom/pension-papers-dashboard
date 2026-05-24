export const PERFORMANCE_NEWS_MAX = 25;
export const PERFORMANCE_NEWS_GLOBAL_RATIO = 3;
export const PERFORMANCE_NEWS_KOREA_RATIO = 2;

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
  "cppib investment performance",
  "ontario teachers pension return",
  "gpif investment performance",
  "nbim fund performance",
  "sovereign pension fund return",
  "institutional pension performance benchmark",
  "국민연금 수익률",
  "국민연금 운용성과",
  "국민연금 성과평가",
  "국민연금 기금성과",
  "연기금 수익률",
  "연기금 운용성과",
  "연기금 성과평가",
  "공적연금 수익률",
  "퇴직연금 수익률",
  "national pension service korea return",
  "NPS korea fund performance",
  "korea pension fund return",
];

export const PERFORMANCE_GLOBAL_GOOGLE_RSS_SEARCHES = [
  { query: "pension+fund+investment+performance", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+annual+return", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+benchmark+performance", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "public+pension+fund+returns", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "global+pension+fund+performance", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "pension+fund+performance+attribution", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "calpers+investment+return", hl: "en-US", gl: "US", ceid: "US:en" },
  { query: "cppib+investment+performance", hl: "en-CA", gl: "CA", ceid: "CA:en" },
  { query: "pension+fund+manager+evaluation", hl: "en-GB", gl: "GB", ceid: "GB:en" },
  { query: "institutional+pension+performance+benchmark", hl: "en-US", gl: "US", ceid: "US:en" },
];

export const PERFORMANCE_KOREA_GOOGLE_RSS_SEARCHES = [
  { query: encodeURIComponent("국민연금+수익률"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+운용성과"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("국민연금+성과평가"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("연기금+수익률"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("연기금+운용성과"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("공적연금+수익률"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: encodeURIComponent("퇴직연금+수익률"), hl: "ko", gl: "KR", ceid: "KR:ko" },
  { query: "national+pension+service+korea+return", hl: "en-US", gl: "KR", ceid: "KR:en" },
  { query: "NPS+korea+fund+performance", hl: "en-US", gl: "KR", ceid: "KR:en" },
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
  "성과 평가",
];

const PENSION_CONTEXT_TERMS = [
  "pension",
  "retirement",
  "superannuation",
  "provident fund",
  "national pension",
  "public pension",
  "calpers",
  "calstrs",
  "cppib",
  "gpif",
  "nbim",
  "연기금",
  "국민연금",
  "공적연금",
  "퇴직연금",
];

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
  const text = `${title} ${description}`.toLowerCase();

  if (!hasPerformanceEvaluationNewsSignal(title, text)) return false;

  return PENSION_CONTEXT_TERMS.some((term) => text.includes(term));
}

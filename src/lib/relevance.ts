import { hasSaaSignal, hasTaaSignal } from "./allocation-signals";
import { hasPriorityRegionSignal } from "./priority-regions";
import { hasKoreaPensionSignal } from "./korea-regions";
import { hasGlobalPensionTrendSignal } from "./global-pension-trends";
import { isNonInvestmentPensionPaper } from "./non-investment-pension-filter";

export type RelevanceMode = "default" | "industry" | "tpa" | "priority" | "korea" | "global-trend";

const PENSION_CORE = [
  "pension",
  "retirement",
  "superannuation",
  "provident fund",
  "public pension",
  "defined benefit",
  "defined contribution",
  "national pension",
];

const INSTITUTIONAL_CORE = [
  ...PENSION_CORE,
  "asset owner",
  "institutional investor",
  "sovereign wealth",
  "sovereign fund",
  "public fund",
  "endowment fund",
  "endowment",
  "super fund",
  "trustee",
  "fund manager",
  "pension fund",
];

const FINANCE_CONTEXT = [
  "fund",
  "investment",
  "portfolio",
  "asset",
  "return",
  "risk",
  "allocation",
  "benefit",
  "liability",
  "governance",
  "strategy",
  "policy",
  "manager",
  "fiduciary",
  "research",
  "report",
  "industry",
  "market",
  "capital",
  "finance",
  "institutional",
  "white paper",
  "outlook",
  "asset management",
];

const FUND_MANAGER_DOMAIN_SIGNALS: Array<{ terms: string[]; weight: number }> =
  [
    {
      terms: [
        "national pension",
        "public pension fund",
        "sovereign pension",
        "government pension",
      ],
      weight: 14,
    },
    {
      terms: ["pension fund", "pension plan", "retirement fund"],
      weight: 12,
    },
    {
      terms: ["fund manager", "asset owner", "institutional investor"],
      weight: 10,
    },
    {
      terms: ["asset management", "portfolio management", "investment strategy"],
      weight: 9,
    },
    { terms: ["finance", "financial"], weight: 7 },
    { terms: ["economics", "econometric", "macroeconomic"], weight: 7 },
    { terms: ["accounting", "actuarial"], weight: 7 },
    {
      terms: [
        "mathematics",
        "mathematical",
        "quantitative",
        "stochastic",
        "optimization",
      ],
      weight: 6,
    },
    {
      terms: [
        "computer science",
        "machine learning",
        "artificial intelligence",
        "algorithm",
        "data science",
      ],
      weight: 5,
    },
  ];

const TPA_TERMS = [
  "total portfolio approach",
  "reference portfolio approach",
  "benchmark reference portfolio",
  "policy reference portfolio",
  "reference portfolio framework",
];

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((count, term) => (text.includes(term) ? count + 1 : count), 0);
}

/** National pension fund 운용 fund manager 관점의 관련도 점수 */
export function scorePaperRelevance(title: string, abstract: string): number {
  const text = `${title} ${abstract}`.toLowerCase();
  const titleLower = title.toLowerCase();
  let score = 0;

  for (const group of FUND_MANAGER_DOMAIN_SIGNALS) {
    const hits = countMatches(text, group.terms);
    if (hits > 0) {
      score += group.weight * hits;
    }
  }

  if (PENSION_CORE.some((kw) => text.includes(kw))) score += 8;
  if (INSTITUTIONAL_CORE.some((kw) => text.includes(kw))) score += 4;
  if (FINANCE_CONTEXT.some((kw) => text.includes(kw))) score += 3;
  if (hasTrueTpaSignal(title, text)) score += 10;
  if (hasSaaSignal(title, text)) score += 8;
  if (hasTaaSignal(title, text)) score += 8;
  if (hasPriorityRegionSignal(text)) score += 12;
  if (hasKoreaPensionSignal(text)) score += 14;
  if (hasGlobalPensionTrendSignal(text)) score += 16;
  if (
    titleLower.includes("benchmark") &&
    (text.includes("pension") || text.includes("manager evaluation"))
  ) {
    score += 10;
  }
  if (
    titleLower.includes("factor") &&
    text.includes("asset allocation") &&
    text.includes("pension")
  ) {
    score += 10;
  }
  if (
    titleLower.includes("strategic") &&
    text.includes("asset allocation") &&
    text.includes("pension")
  ) {
    score += 10;
  }
  if (
    text.includes("portfolio management") ||
    text.includes("investment strategy") ||
    text.includes("portfolio policy")
  ) {
    score += 6;
  }

  if (titleLower.includes("pension") || titleLower.includes("retirement")) {
    score += 6;
  }

  const hasQuantOrCs = [
    "mathematics",
    "mathematical",
    "computer science",
    "machine learning",
    "algorithm",
  ].some((term) => text.includes(term));

  if (
    hasQuantOrCs &&
    !(
      text.includes("pension") ||
      text.includes("portfolio") ||
      text.includes("asset") ||
      text.includes("fund") ||
      text.includes("investment")
    )
  ) {
    score -= 8;
  }

  return Math.max(0, score);
}

export function hasTrueTpaSignal(title: string, text: string): boolean {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("total portfolio approach")) return true;
  if (text.includes("total portfolio approach")) return true;
  if (TPA_TERMS.some((term) => text.includes(term))) return true;

  if (text.includes("reference portfolio")) {
    return (
      text.includes("pension") ||
      text.includes("asset owner") ||
      text.includes("institutional investor") ||
      text.includes("sovereign wealth") ||
      text.includes("endowment") ||
      text.includes("fiduciary") ||
      titleLower.includes("practitioner")
    );
  }

  return false;
}

const INDUSTRY_PUBLICATION_TYPES = new Set([
  "report",
  "preprint",
  "article",
  "book",
  "book-chapter",
  "other",
]);

export function isPaperRelevant(
  title: string,
  abstract: string,
  mode: RelevanceMode = "default",
  publicationType?: string
): boolean {
  const text = `${title} ${abstract}`.toLowerCase();
  const titleLower = title.toLowerCase();
  const normalizedType = publicationType?.toLowerCase().replace(/\s+/g, "-");
  const relevanceScore = scorePaperRelevance(title, abstract);

  if (isNonInvestmentPensionPaper({ title, abstract, journal: "" })) {
    return false;
  }

  if (mode === "tpa") {
    if (!hasTrueTpaSignal(title, text)) return false;

    if (titleLower.includes("total portfolio approach")) {
      return (
        FINANCE_CONTEXT.some((kw) => text.includes(kw)) ||
        titleLower.includes("pension") ||
        titleLower.includes("practitioner") ||
        titleLower.includes("institutional") ||
        titleLower.includes("asset owner") ||
        titleLower.includes("fund")
      );
    }

    return (
      INSTITUTIONAL_CORE.some((kw) => text.includes(kw)) ||
      text.includes("portfolio approach") ||
      text.includes("white paper")
    );
  }

  if (mode === "industry") {
    if (INSTITUTIONAL_CORE.some((kw) => text.includes(kw))) {
      return FINANCE_CONTEXT.some((kw) => text.includes(kw));
    }

    if (normalizedType && INDUSTRY_PUBLICATION_TYPES.has(normalizedType)) {
      return (
        FINANCE_CONTEXT.some((kw) => text.includes(kw)) || relevanceScore >= 12
      );
    }

    return relevanceScore >= 14;
  }

  if (mode === "priority") {
    if (!hasPriorityRegionSignal(text)) return false;

    return (
      PENSION_CORE.some((kw) => text.includes(kw)) ||
      INSTITUTIONAL_CORE.some((kw) => text.includes(kw)) ||
      (FINANCE_CONTEXT.some((kw) => text.includes(kw)) && relevanceScore >= 8)
    );
  }

  if (mode === "korea") {
    if (!hasKoreaPensionSignal(text)) return false;

    return (
      PENSION_CORE.some((kw) => text.includes(kw)) ||
      INSTITUTIONAL_CORE.some((kw) => text.includes(kw)) ||
      FINANCE_CONTEXT.some((kw) => text.includes(kw)) ||
      relevanceScore >= 6
    );
  }

  if (mode === "global-trend") {
    if (!hasGlobalPensionTrendSignal(text)) return false;

    return (
      PENSION_CORE.some((kw) => text.includes(kw)) ||
      INSTITUTIONAL_CORE.some((kw) => text.includes(kw)) ||
      FINANCE_CONTEXT.some((kw) => text.includes(kw)) ||
      relevanceScore >= 8
    );
  }

  if (
    titleLower.includes("benchmark") &&
    titleLower.includes("pension") &&
    FINANCE_CONTEXT.some((kw) => text.includes(kw))
  ) {
    return true;
  }

  if (
    (titleLower.includes("strategic asset allocation") ||
      titleLower.includes("factor-based asset allocation") ||
      titleLower.includes("factor based asset allocation")) &&
    (text.includes("pension") ||
      text.includes("portfolio") ||
      relevanceScore >= 10)
  ) {
    return true;
  }

  if (hasKoreaPensionSignal(text)) {
    return (
      FINANCE_CONTEXT.some((kw) => text.includes(kw)) || relevanceScore >= 10
    );
  }

  if (PENSION_CORE.some((kw) => text.includes(kw))) {
    return (
      FINANCE_CONTEXT.some((kw) => text.includes(kw)) || relevanceScore >= 10
    );
  }

  if (hasTrueTpaSignal(title, text)) {
    return INSTITUTIONAL_CORE.some((kw) => text.includes(kw));
  }

  return relevanceScore >= 16;
}

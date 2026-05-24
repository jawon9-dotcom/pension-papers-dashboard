import {
  AllocationSubCategory,
  MainCategory,
  ManagementSubCategory,
  SubCategory,
} from "@/types/paper";
import {
  hasSaaSignal,
  hasTaaSignal,
  resolveSaaTaaSubCategory,
} from "./allocation-signals";
interface CategoryRule {
  category: MainCategory;
  subCategory?: SubCategory;
  keywords: string[];
  weight?: number;
}

const ACRONYM_KEYWORDS = new Set(["saa", "taa", "tpa", "ldi", "var", "erm"]);

const RULES: CategoryRule[] = [
  {
    category: "performance-evaluation",
    keywords: [
      "performance",
      "attribution",
      "benchmark",
      "alpha",
      "sharpe",
      "peer group",
      "evaluation",
      "excess return",
      "tracking error",
    ],
    weight: 1.2,
  },
  {
    category: "risk-management",
    keywords: [
      "risk management",
      "risk",
      "var",
      "stress test",
      "climate risk",
      "liquidity",
      "volatility",
      "drawdown",
      "hedge",
      "erm",
      "solvency",
    ],
    weight: 1.1,
  },
  {
    category: "asset-allocation",
    subCategory: "saa",
    keywords: [
      "strategic asset allocation",
      "strategic asset mix",
      "strategic portfolio allocation",
      "strategic allocation",
      "strategic allocation policy",
      "policy portfolio",
      "policy asset allocation",
      "long-term asset allocation",
      "long-term allocation",
      "long run asset allocation",
      "target asset allocation",
      "asset mix policy",
      "investment policy statement",
      "saa",
      "전략적 자산배분",
      "전략적자산배분",
      "전략적 배분",
      "장기 자산배분",
      "정책 포트폴리오",
      "정책자산배분",
    ],
    weight: 1.6,
  },
  {
    category: "asset-allocation",
    subCategory: "taa",
    keywords: [
      "tactical asset allocation",
      "tactical asset mix",
      "tactical portfolio allocation",
      "tactical allocation",
      "dynamic tactical allocation",
      "dynamic asset allocation",
      "overlay strategy",
      "tactical overlay",
      "market timing",
      "tactical shift",
      "tactical positioning",
      "short-term asset allocation",
      "regime-based allocation",
      "portfolio tilt",
      "taa",
      "전술적 자산배분",
      "전술적자산배분",
      "전술적 배분",
      "단기 자산배분",
      "동적 자산배분",
    ],
    weight: 1.6,
  },
  {
    category: "asset-allocation",
    subCategory: "tpa",
    keywords: [
      "total portfolio approach",
      "reference portfolio",
      "reference portfolio approach",
      "benchmark reference portfolio",
      "policy reference portfolio",
      "reference portfolio framework",
      "liberating portfolio",
      "holistic portfolio approach",
    ],
    weight: 1.8,
  },
  {
    category: "asset-allocation",
    subCategory: "strategy-general",
    keywords: [
      "asset allocation",
      "glide path",
      "rebalancing",
      "portfolio construction",
      "target date",
      "allocation policy",
      "investment policy",
      "portfolio strategy",
      "자산배분",
    ],
    weight: 1.0,
  },
  {
    category: "asset-management",
    subCategory: "equity",
    keywords: [
      "equity",
      "stock",
      "shares",
      "esg",
      "active management",
      "index fund",
      "passive",
    ],
  },
  {
    category: "asset-management",
    subCategory: "bond",
    keywords: [
      "bond",
      "fixed income",
      "credit",
      "ldi",
      "liability driven",
      "immunization",
      "yield",
      "duration",
      "treasury",
    ],
  },
  {
    category: "asset-management",
    subCategory: "alternative",
    keywords: [
      "private equity",
      "infrastructure",
      "hedge fund",
      "alternative investment",
      "real asset",
      "real estate",
      "private market",
      "illiquid",
    ],
  },
];

function includesKeyword(text: string, keyword: string): boolean {
  const normalized = keyword.toLowerCase();
  if (ACRONYM_KEYWORDS.has(normalized)) {
    return new RegExp(`\\b${normalized}\\b`, "i").test(text);
  }
  return text.includes(normalized);
}

function scoreRule(text: string, rule: CategoryRule): number {
  let score = 0;
  for (const kw of rule.keywords) {
    if (includesKeyword(text, kw)) score += rule.weight ?? 1;
  }
  return score;
}

function pickTopSub<T extends string>(
  scores: Partial<Record<T, number>>,
  fallback: T
): T {
  let top = fallback;
  let topScore = 0;
  for (const [sub, score] of Object.entries(scores) as [T, number][]) {
    if (score > topScore) {
      topScore = score;
      top = sub;
    }
  }
  return topScore > 0 ? top : fallback;
}

function applyTpaOverride(
  title: string,
  abstract: string,
  result: { category: MainCategory; subCategory?: SubCategory }
): { category: MainCategory; subCategory?: SubCategory } {
  const text = `${title} ${abstract}`.toLowerCase();

  if (
    text.includes("mutual fund") &&
    !text.includes("total portfolio approach") &&
    !text.includes("pension")
  ) {
    return result;
  }

  const hasTpaTerm =
    text.includes("total portfolio approach") ||
    text.includes("reference portfolio approach") ||
    (text.includes("reference portfolio") &&
      (text.includes("pension") ||
        text.includes("asset owner") ||
        text.includes("institutional investor") ||
        text.includes("sovereign") ||
        text.includes("endowment") ||
        text.includes("white paper")));

  if (!hasTpaTerm) return result;

  return { category: "asset-allocation", subCategory: "tpa" };
}

function applySaaTaaOverride(
  title: string,
  abstract: string,
  result: { category: MainCategory; subCategory?: SubCategory }
): { category: MainCategory; subCategory?: SubCategory } {
  if (result.category !== "asset-allocation") return result;
  if (result.subCategory === "tpa") return result;

  const text = `${title} ${abstract}`.toLowerCase();
  const resolved = resolveSaaTaaSubCategory(title, text);
  if (resolved) {
    return { ...result, subCategory: resolved };
  }

  return result;
}

export function categorizePaper(
  title: string,
  abstract: string
): { category: MainCategory; subCategory?: SubCategory } {
  const text = `${title} ${abstract}`.toLowerCase();
  const titleLower = title.toLowerCase();

  let bestCategory: MainCategory = "asset-allocation";
  let bestScore = 0;

  const categoryScores: Partial<Record<MainCategory, number>> = {};
  const allocationSubScores: Partial<Record<AllocationSubCategory, number>> = {};
  const managementSubScores: Partial<Record<ManagementSubCategory, number>> = {};

  const tpaTitleBoost = titleLower.includes("total portfolio approach")
    ? 2.5
    : 0;
  if (tpaTitleBoost > 0) {
    categoryScores["asset-allocation"] =
      (categoryScores["asset-allocation"] ?? 0) + tpaTitleBoost;
    allocationSubScores.tpa = (allocationSubScores.tpa ?? 0) + tpaTitleBoost;
  }

  if (hasSaaSignal(title, text)) {
    const boost = hasSaaSignal(title, titleLower) ? 3 : 2;
    categoryScores["asset-allocation"] =
      (categoryScores["asset-allocation"] ?? 0) + boost;
    allocationSubScores.saa = (allocationSubScores.saa ?? 0) + boost;
  }

  if (hasTaaSignal(title, text)) {
    const boost = hasTaaSignal(title, titleLower) ? 3 : 2;
    categoryScores["asset-allocation"] =
      (categoryScores["asset-allocation"] ?? 0) + boost;
    allocationSubScores.taa = (allocationSubScores.taa ?? 0) + boost;
  }

  for (const rule of RULES) {
    const score = scoreRule(text, rule);
    if (score === 0) continue;

    categoryScores[rule.category] = (categoryScores[rule.category] ?? 0) + score;

    if (rule.subCategory) {
      if (rule.category === "asset-allocation") {
        allocationSubScores[rule.subCategory as AllocationSubCategory] =
          (allocationSubScores[rule.subCategory as AllocationSubCategory] ?? 0) +
          score;
      }
      if (rule.category === "asset-management") {
        managementSubScores[rule.subCategory as ManagementSubCategory] =
          (managementSubScores[rule.subCategory as ManagementSubCategory] ?? 0) +
          score;
      }
    }
  }

  for (const [cat, score] of Object.entries(categoryScores) as [
    MainCategory,
    number,
  ][]) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  if (bestCategory === "asset-management") {
    return applySaaTaaOverride(
      title,
      abstract,
      applyTpaOverride(title, abstract, {
        category: bestCategory,
        subCategory: pickTopSub(managementSubScores, "equity"),
      })
    );
  }

  if (bestCategory === "asset-allocation") {
    return applySaaTaaOverride(
      title,
      abstract,
      applyTpaOverride(title, abstract, {
        category: bestCategory,
        subCategory: pickTopSub(allocationSubScores, "strategy-general"),
      })
    );
  }

  if (bestScore === 0) {
    if (text.includes("pension") || text.includes("retirement")) {
      return applySaaTaaOverride(
        title,
        abstract,
        applyTpaOverride(title, abstract, {
          category: "asset-allocation",
          subCategory: "strategy-general",
        })
      );
    }
    return applySaaTaaOverride(
      title,
      abstract,
      applyTpaOverride(title, abstract, {
        category: "asset-management",
        subCategory: "equity",
      })
    );
  }

  return applySaaTaaOverride(
    title,
    abstract,
    applyTpaOverride(title, abstract, { category: bestCategory })
  );
}

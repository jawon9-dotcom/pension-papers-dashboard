import {
  AllocationSubCategory,
  MainCategory,
  ManagementSubCategory,
  SubCategory,
} from "@/types/paper";

interface CategoryRule {
  category: MainCategory;
  subCategory?: SubCategory;
  keywords: string[];
  weight?: number;
}

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
      "strategic allocation",
      "saa",
      "policy portfolio",
      "long-term allocation",
      "policy benchmark",
    ],
    weight: 1.4,
  },
  {
    category: "asset-allocation",
    subCategory: "taa",
    keywords: [
      "tactical asset allocation",
      "tactical allocation",
      "taa",
      "dynamic asset allocation",
      "overlay strategy",
      "market timing",
    ],
    weight: 1.4,
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
    ],
    weight: 1.2,
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

function scoreRule(text: string, rule: CategoryRule): number {
  let score = 0;
  for (const kw of rule.keywords) {
    if (text.includes(kw)) score += rule.weight ?? 1;
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
    return applyTpaOverride(title, abstract, {
      category: bestCategory,
      subCategory: pickTopSub(managementSubScores, "equity"),
    });
  }

  if (bestCategory === "asset-allocation") {
    return applyTpaOverride(title, abstract, {
      category: bestCategory,
      subCategory: pickTopSub(allocationSubScores, "strategy-general"),
    });
  }

  if (bestScore === 0) {
    if (text.includes("pension") || text.includes("retirement")) {
      return applyTpaOverride(title, abstract, {
        category: "asset-allocation",
        subCategory: "strategy-general",
      });
    }
    return applyTpaOverride(title, abstract, {
      category: "asset-management",
      subCategory: "equity",
    });
  }

  return applyTpaOverride(title, abstract, { category: bestCategory });
}

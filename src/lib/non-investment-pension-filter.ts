import { MainCategory, Paper, SubCategory } from "@/types/paper";
import { hasGlobalPensionTrendSignal } from "./global-pension-trends";
import { hasPriorityRegionSignal } from "./priority-regions";
import { hasKoreaPensionSignal } from "./korea-regions";

const PENSION_CONTEXT = [
  "pension",
  "retirement",
  "superannuation",
  "provident fund",
  "national pension",
];

const INSTITUTIONAL_CONTEXT = [
  "pension fund",
  "pension plan",
  "retirement fund",
  "asset owner",
  "institutional investor",
  "sovereign wealth",
  "sovereign fund",
  "public fund",
  "endowment",
  "super fund",
  "연기금",
  "국민연금",
  "공적연금",
];

export const ALLOCATION_STRATEGY_SIGNALS = [
  "asset allocation",
  "investment strategy",
  "investment policy",
  "portfolio strategy",
  "portfolio policy",
  "portfolio construction",
  "portfolio management",
  "allocation policy",
  "ldi",
  "liability driven",
  "liability-driven",
  "asset liability management",
  "asset-liability management",
  "alm",
  "glide path",
  "rebalancing",
  "total portfolio approach",
  "reference portfolio",
  "strategic asset allocation",
  "tactical asset allocation",
  "factor based",
  "factor investing",
  "pension fund strategy",
  "pension fund investment",
  "pension portfolio",
  "pension investment",
  "investment policy statement",
  "policy portfolio",
  "운용전략",
  "자산배분",
  "부채연동",
  "연기금 투자",
  "기금운용",
];

const INVESTMENT_OPERATION_SIGNALS = [
  ...ALLOCATION_STRATEGY_SIGNALS,
  "fund manager",
  "asset manager",
  "asset management",
  "private equity",
  "alternative investment",
  "real estate fund",
  "infrastructure investment",
  "hedge fund",
  "fixed income",
  "equity portfolio",
  "bond portfolio",
  "benchmark",
  "performance attribution",
  "risk management",
  "manager selection",
  "manager evaluation",
  "fiduciary",
  "custodian",
  "fund performance",
  "alpha",
  "tracking error",
  "대체투자",
  "사모펀드",
  "long-term invest",
  "capital market",
];

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /eurovision/i,
  /academic-industry partnership/i,
  /academic industry partnership/i,
  /degree program/i,
  /professional degree/i,
  /technical and professional/i,
  /higher education/i,
  /curriculum design/i,
  /undergraduate program/i,
  /vocational education/i,
  /teacher training/i,
  /music festival/i,
  /entertainment industry/i,
  /television broadcast/i,
  /clinical trial/i,
  /medical treatment/i,
  /cancer therapy/i,
  /agricultural crop/i,
  /climate change adaptation(?!.*portfolio)/i,
];

const NON_INVESTMENT_PENSION_PATTERNS: RegExp[] = [
  /sexual orientation/i,
  /legacy for the kids/i,
  /distributive justice/i,
  /intergenerational solidarity/i,
  /intergenerational equity/i,
  /intergenerational justice/i,
  /intergenerational distribut/i,
  /one-sided sacrifice/i,
  /sacrifice of future generation/i,
  /gender gap/i,
  /gender inequality/i,
  /marital status/i,
  /marriage and pension/i,
  /fertility rate/i,
  /life satisfaction/i,
  /subjective well-being/i,
  /happiness and pension/i,
  /political preference/i,
  /voting behavior/i,
  /social norm/i,
  /household saving behavior/i,
  /individual saving/i,
  /consumer behavio/i,
  /retirement planning behavio/i,
  /financial literacy/i,
  /bequest motive/i,
  /inheritance motive/i,
  /세대간/i,
  /세대 간/i,
  /분배정의/i,
  /성적 지향/i,
];

function hasPensionContext(text: string): boolean {
  return PENSION_CONTEXT.some((term) => text.includes(term));
}

function hasInstitutionalPensionContext(text: string): boolean {
  return (
    hasPensionContext(text) ||
    INSTITUTIONAL_CONTEXT.some((term) => text.includes(term)) ||
    hasGlobalPensionTrendSignal(text) ||
    hasPriorityRegionSignal(text) ||
    hasKoreaPensionSignal(text)
  );
}

export function hasInvestmentOperationSignal(text: string): boolean {
  return INVESTMENT_OPERATION_SIGNALS.some((term) => text.includes(term));
}

export function hasAllocationStrategySignal(text: string): boolean {
  return ALLOCATION_STRATEGY_SIGNALS.some((term) => text.includes(term));
}

export function isNonInvestmentPensionPaper(
  paper: Pick<Paper, "title" | "abstract" | "journal">
): boolean {
  const text = `${paper.title} ${paper.abstract} ${paper.journal}`.toLowerCase();

  if (!hasPensionContext(text)) return false;
  if (hasInvestmentOperationSignal(text)) return false;

  if (NON_INVESTMENT_PENSION_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  if (
    (text.includes("intergenerational") || text.includes("solidarity")) &&
    (text.includes("justice") ||
      text.includes("equity") ||
      text.includes("welfare") ||
      text.includes("policy debate"))
  ) {
    return true;
  }

  if (
    text.includes("investment motive") ||
    text.includes("investment motives") ||
    text.includes("saving motive")
  ) {
    return true;
  }

  return false;
}

export function isFundManagerEligiblePaper(
  paper: Pick<Paper, "title" | "abstract" | "journal"> & {
    category?: MainCategory;
    subCategory?: SubCategory;
  }
): boolean {
  const text = `${paper.title} ${paper.abstract} ${paper.journal}`.toLowerCase();

  if (OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text))) {
    return false;
  }

  if (isNonInvestmentPensionPaper(paper)) {
    return false;
  }

  const institutional = hasInstitutionalPensionContext(text);
  const ops = hasInvestmentOperationSignal(text);
  const strategy = hasAllocationStrategySignal(text);

  if (!institutional || (!ops && !strategy)) {
    return false;
  }

  if (
    paper.category === "asset-allocation" &&
    paper.subCategory === "strategy-general" &&
    !strategy
  ) {
    return false;
  }

  return true;
}

export function filterNonInvestmentPensionPapers<T extends Paper>(
  papers: T[]
): T[] {
  return papers.filter((paper) => isFundManagerEligiblePaper(paper));
}

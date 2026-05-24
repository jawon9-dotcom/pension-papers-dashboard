import { Paper } from "@/types/paper";

const PENSION_CONTEXT = [
  "pension",
  "retirement",
  "superannuation",
  "provident fund",
  "national pension",
];

const INVESTMENT_OPERATION_SIGNALS = [
  "asset allocation",
  "portfolio management",
  "portfolio construction",
  "investment strategy",
  "investment policy",
  "fund manager",
  "asset manager",
  "asset management",
  "asset owner",
  "institutional investor",
  "private equity",
  "alternative investment",
  "real estate fund",
  "infrastructure investment",
  "hedge fund",
  "fixed income",
  "equity portfolio",
  "bond portfolio",
  "liability driven",
  "ldi",
  "benchmark",
  "performance attribution",
  "risk management",
  "total portfolio approach",
  "reference portfolio",
  "strategic asset allocation",
  "tactical asset allocation",
  "factor investing",
  "factor based",
  "manager selection",
  "manager evaluation",
  "fiduciary",
  "glide path",
  "rebalancing",
  "custodian",
  "sovereign wealth",
  "pension fund investment",
  "fund performance",
  "alpha",
  "tracking error",
  "자산배분",
  "포트폴리오",
  "운용",
  "투자전략",
  "대체투자",
  "사모펀드",
  "연기금 투자",
  "기금운용",
  "long-term invest",
  "capital market",
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

function hasInvestmentOperationSignal(text: string): boolean {
  return INVESTMENT_OPERATION_SIGNALS.some((term) => text.includes(term));
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

export function filterNonInvestmentPensionPapers<T extends Paper>(
  papers: T[]
): T[] {
  return papers.filter((paper) => !isNonInvestmentPensionPaper(paper));
}

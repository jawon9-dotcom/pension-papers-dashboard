export type RelevanceMode = "default" | "industry" | "tpa";

const PENSION_CORE = [
  "pension",
  "retirement",
  "superannuation",
  "provident fund",
  "public pension",
  "defined benefit",
  "defined contribution",
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
];

const TPA_TERMS = [
  "total portfolio approach",
  "reference portfolio approach",
  "benchmark reference portfolio",
  "policy reference portfolio",
  "reference portfolio framework",
];

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
      return FINANCE_CONTEXT.some((kw) => text.includes(kw));
    }

    return false;
  }

  if (!PENSION_CORE.some((kw) => text.includes(kw))) {
    if (!hasTrueTpaSignal(title, text)) return false;
    return INSTITUTIONAL_CORE.some((kw) => text.includes(kw));
  }
  return FINANCE_CONTEXT.some((kw) => text.includes(kw));
}

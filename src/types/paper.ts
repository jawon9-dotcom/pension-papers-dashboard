export type MainCategory =
  | "asset-allocation"
  | "asset-management"
  | "risk-management"
  | "performance-evaluation";

export type AllocationSubCategory = "saa" | "taa" | "tpa" | "strategy-general";
export type ManagementSubCategory = "equity" | "bond" | "alternative";
export type SubCategory = AllocationSubCategory | ManagementSubCategory;

export interface Paper {
  id: string;
  openAlexId?: string;
  title: string;
  titleKo: string;
  authors: string[];
  year: number;
  journal: string;
  category: MainCategory;
  subCategory?: SubCategory;
  abstract: string;
  abstractKo: string;
  summaryKo: string;
  originalUrl: string;
  pdfUrl?: string;
  hasAiSummary?: boolean;
  countryCode?: string;
  citationCount?: number;
  sourceSite?: string;
  publicationType?: string;
  isNewsArticle?: boolean;
  popularityScore?: number;
  /** ISO 8601 — 뉴스 기사 게시일 */
  publishedAt?: string;
}

export const CATEGORY_LABELS: Record<MainCategory, string> = {
  "asset-allocation": "운용전략",
  "asset-management": "자산운용",
  "risk-management": "리스크관리",
  "performance-evaluation": "성과평가",
};

export const ALLOCATION_SUB_CATEGORY_LABELS: Record<AllocationSubCategory, string> = {
  saa: "SAA",
  taa: "TAA",
  tpa: "TPA",
  "strategy-general": "그 외",
};

export const MANAGEMENT_SUB_CATEGORY_LABELS: Record<ManagementSubCategory, string> = {
  equity: "주식",
  bond: "채권",
  alternative: "대체투자",
};

export const SUB_CATEGORY_LABELS: Record<SubCategory, string> = {
  ...ALLOCATION_SUB_CATEGORY_LABELS,
  ...MANAGEMENT_SUB_CATEGORY_LABELS,
};

export const CATEGORY_COLORS: Record<MainCategory, string> = {
  "asset-allocation": "emerald",
  "asset-management": "blue",
  "risk-management": "amber",
  "performance-evaluation": "violet",
};

export const CATEGORY_INLINE_SUB_LABELS: Partial<Record<MainCategory, string>> =
  {
    "asset-allocation": "SAA · TAA · TPA · 그 외",
    "asset-management": "주식 · 채권 · 대체투자",
  };

export const CATEGORY_SUB_CATEGORIES: Partial<
  Record<MainCategory, SubCategory[]>
> = {
  "asset-allocation": ["saa", "taa", "tpa", "strategy-general"],
  "asset-management": ["equity", "bond", "alternative"],
};

export function getCategoryInlineSubLabels(
  category: MainCategory | "all"
): string | null {
  if (category === "all") return null;
  return CATEGORY_INLINE_SUB_LABELS[category] ?? null;
}

export function getPublicationSourceLabel(paper: Paper): string {
  if (paper.isNewsArticle) {
    const site = paper.sourceSite ?? "뉴스";
    return `뉴스 · ${site}`;
  }
  if (paper.journal && paper.journal !== "Academic Journal") {
    return paper.journal;
  }
  if (paper.publicationType) {
    return paper.publicationType;
  }
  return paper.sourceSite ?? "원문";
}

export function formatNewsPublishDate(paper: Paper): string | null {
  if (!paper.isNewsArticle) return null;

  if (paper.publishedAt) {
    const date = new Date(paper.publishedAt);
    if (Number.isFinite(date.getTime())) {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  if (paper.year) return `${paper.year}년`;
  return null;
}

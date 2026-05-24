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
}

export const CATEGORY_LABELS: Record<MainCategory, string> = {
  "asset-allocation": "운용전략",
  "asset-management": "자산운용",
  "risk-management": "리스크관리",
  "performance-evaluation": "성과평가",
};

export const ALLOCATION_SUB_CATEGORY_LABELS: Record<AllocationSubCategory, string> = {
  saa: "SAA(전략적 자산배분)",
  taa: "TAA(전술적 자산배분)",
  tpa: "TPA(기준포트폴리오)",
  "strategy-general": "그 외 운용전략",
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

export function getSubCategoryLabel(
  category: MainCategory,
  subCategory?: SubCategory
): string | undefined {
  if (!subCategory) return undefined;
  return SUB_CATEGORY_LABELS[subCategory];
}

export function getPublicationSourceLabel(paper: Paper): string {
  if (paper.journal && paper.journal !== "Academic Journal") {
    return paper.journal;
  }
  if (paper.publicationType) {
    return paper.publicationType;
  }
  return paper.sourceSite ?? "원문";
}

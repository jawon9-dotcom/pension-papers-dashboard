import { MainCategory, Paper, SubCategory } from "@/types/paper";

export const MY_LIST_STORAGE = "pension-dashboard-my-list";

export interface SavedPaperItem {
  id: string;
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
  isNewsArticle?: boolean;
  sourceSite?: string;
  countryCode?: string;
  citationCount?: number;
  popularityScore?: number;
  savedAt: string;
}

export function paperToSavedItem(paper: Paper): SavedPaperItem {
  return {
    id: paper.id,
    title: paper.title,
    titleKo: paper.titleKo,
    authors: paper.authors,
    year: paper.year,
    journal: paper.journal,
    category: paper.category,
    subCategory: paper.subCategory,
    abstract: paper.abstract,
    abstractKo: paper.abstractKo,
    summaryKo: paper.summaryKo,
    originalUrl: paper.originalUrl,
    pdfUrl: paper.pdfUrl,
    isNewsArticle: paper.isNewsArticle,
    sourceSite: paper.sourceSite,
    countryCode: paper.countryCode,
    citationCount: paper.citationCount,
    popularityScore: paper.popularityScore,
    savedAt: new Date().toISOString(),
  };
}

export function savedItemToPaper(item: SavedPaperItem): Paper {
  return {
    id: item.id,
    title: item.title,
    titleKo: item.titleKo,
    authors: item.authors,
    year: item.year,
    journal: item.journal,
    category: item.category,
    subCategory: item.subCategory,
    abstract: item.abstract,
    abstractKo: item.abstractKo,
    summaryKo: item.summaryKo,
    originalUrl: item.originalUrl,
    pdfUrl: item.pdfUrl,
    isNewsArticle: item.isNewsArticle,
    sourceSite: item.sourceSite,
    countryCode: item.countryCode,
    citationCount: item.citationCount,
    popularityScore: item.popularityScore,
  };
}

export function resolveSavedPaper(item: SavedPaperItem, papers: Paper[]): Paper {
  return papers.find((paper) => paper.id === item.id) ?? savedItemToPaper(item);
}

export function loadMyList(): SavedPaperItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(MY_LIST_STORAGE);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is SavedPaperItem =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as SavedPaperItem).id === "string" &&
            typeof (item as SavedPaperItem).titleKo === "string"
        )
    );
  } catch {
    return [];
  }
}

export function saveMyList(items: SavedPaperItem[]): void {
  localStorage.setItem(MY_LIST_STORAGE, JSON.stringify(items));
}

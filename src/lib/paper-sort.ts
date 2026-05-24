import { Paper } from "@/types/paper";
import { scorePaperRelevance } from "./relevance";

export type PaperSortField = "newest" | "citations";
export type PaperSortDirection = "asc" | "desc";

export interface PaperSortState {
  field: PaperSortField;
  direction: PaperSortDirection;
}

/** 논문: 인용순 → 최신순 기본 */
export const DEFAULT_PAPER_SORT: PaperSortState = {
  field: "citations",
  direction: "desc",
};

export function getPaperSortLabel(sort: PaperSortState): string {
  if (sort.field === "citations") return "인용순 · 최신순";
  return sort.direction === "desc" ? "최신순" : "오래된순";
}

export function togglePaperSort(
  current: PaperSortState,
  field: PaperSortField
): PaperSortState {
  if (current.field === field) {
    if (field === "newest") {
      return {
        field,
        direction: current.direction === "desc" ? "asc" : "desc",
      };
    }
    return current;
  }

  return { field, direction: "desc" };
}

function getNewsRankingScore(paper: Paper): number {
  return paper.popularityScore ?? 0;
}

function compareAcademicPapers(
  a: Paper,
  b: Paper,
  sort: PaperSortState
): number {
  const relevanceDiff =
    scorePaperRelevance(b.title, b.abstract) -
    scorePaperRelevance(a.title, a.abstract);

  if (sort.field === "citations") {
    const citationDiff = (b.citationCount ?? 0) - (a.citationCount ?? 0);
    const directed =
      sort.direction === "desc" ? citationDiff : -citationDiff;
    return (
      directed ||
      b.year - a.year ||
      relevanceDiff ||
      a.title.localeCompare(b.title)
    );
  }

  const yearDiff = b.year - a.year;
  const directedYear = sort.direction === "desc" ? yearDiff : -yearDiff;
  return (
    directedYear ||
    (b.citationCount ?? 0) - (a.citationCount ?? 0) ||
    relevanceDiff ||
    a.title.localeCompare(b.title)
  );
}

function compareNewsArticles(a: Paper, b: Paper): number {
  return (
    getNewsRankingScore(b) - getNewsRankingScore(a) ||
    b.year - a.year ||
    a.title.localeCompare(b.title)
  );
}

export function sortPapers(papers: Paper[], sort: PaperSortState): Paper[] {
  const sorted = [...papers];

  sorted.sort((a, b) => {
    const aNews = a.isNewsArticle === true;
    const bNews = b.isNewsArticle === true;

    if (aNews && bNews) {
      return compareNewsArticles(a, b);
    }

    if (aNews !== bNews) {
      if (!aNews && bNews) return -1;
      if (aNews && !bNews) return 1;
    }

    return compareAcademicPapers(a, b, sort);
  });

  return sorted;
}

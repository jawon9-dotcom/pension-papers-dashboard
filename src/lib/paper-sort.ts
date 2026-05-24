import { Paper } from "@/types/paper";

export type PaperSortField = "newest" | "citations";
export type PaperSortDirection = "asc" | "desc";

export interface PaperSortState {
  field: PaperSortField;
  direction: PaperSortDirection;
}

export const DEFAULT_PAPER_SORT: PaperSortState = {
  field: "newest",
  direction: "desc",
};

export function getPaperSortLabel(sort: PaperSortState): string {
  if (sort.field === "citations") return "인용순";
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

function getRankingScore(paper: Paper): number {
  if (paper.isNewsArticle && (paper.popularityScore ?? 0) > 0) {
    return paper.popularityScore ?? 0;
  }
  return paper.citationCount ?? 0;
}

export function sortPapers(papers: Paper[], sort: PaperSortState): Paper[] {
  const sorted = [...papers];

  if (sort.field === "citations") {
    sorted.sort((a, b) => {
      const scoreDiff = getRankingScore(b) - getRankingScore(a);
      const directed = sort.direction === "desc" ? scoreDiff : -scoreDiff;
      return directed || b.year - a.year || a.title.localeCompare(b.title);
    });
    return sorted;
  }

  sorted.sort((a, b) => {
    const yearDiff = b.year - a.year;
    const directedYearDiff = sort.direction === "desc" ? yearDiff : -yearDiff;
    return (
      directedYearDiff ||
      getRankingScore(b) - getRankingScore(a) ||
      a.title.localeCompare(b.title)
    );
  });

  return sorted;
}

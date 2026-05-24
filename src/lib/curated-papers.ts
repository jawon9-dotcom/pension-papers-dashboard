import { papers as curatedPapers } from "@/data/papers";
import { Paper } from "@/types/paper";
import { filterOutAfricanPapers } from "./africa-filter";
import { filterPapersByYear, FetchPeriod } from "./period";
import { enrichPapers } from "./source";

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCuratedPapers(period: FetchPeriod): Paper[] {
  return filterOutAfricanPapers(
    filterPapersByYear(enrichPapers(curatedPapers), period.yearFrom, period.yearTo)
  );
}

export function mergeCuratedPapers(
  papers: Paper[],
  period: FetchPeriod
): Paper[] {
  const filtered = filterOutAfricanPapers(papers);
  const existingIds = new Set(filtered.map((paper) => paper.id));
  const existingTitles = new Set(
    filtered.map((paper) => normalizeTitle(paper.title))
  );
  const merged = [...filtered];

  for (const paper of getCuratedPapers(period)) {
    const titleKey = normalizeTitle(paper.title);
    if (existingIds.has(paper.id) || existingTitles.has(titleKey)) continue;

    merged.push(paper);
    existingIds.add(paper.id);
    existingTitles.add(titleKey);
  }

  return merged;
}

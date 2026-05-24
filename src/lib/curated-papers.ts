import { papers as curatedPapers } from "@/data/papers";
import { Paper } from "@/types/paper";
import { deduplicatePapers, normalizePaperTitle } from "./deduplicate-papers";
import { filterExcludedRegionPapers } from "./paper-region-filter";
import { filterPapersByYear, FetchPeriod } from "./period";
import { enrichPapers } from "./source";

export function getCuratedPapers(period: FetchPeriod): Paper[] {
  return deduplicatePapers(
    filterExcludedRegionPapers(
      filterPapersByYear(enrichPapers(curatedPapers), period.yearFrom, period.yearTo)
    )
  );
}

export function mergeCuratedPapers(
  papers: Paper[],
  period: FetchPeriod
): Paper[] {
  const filtered = deduplicatePapers(filterExcludedRegionPapers(papers));
  const existingIds = new Set(filtered.map((paper) => paper.id));
  const existingTitles = new Set(
    filtered.map((paper) => normalizePaperTitle(paper.title))
  );
  const merged = [...filtered];

  for (const paper of getCuratedPapers(period)) {
    const titleKey = normalizePaperTitle(paper.title);
    if (existingIds.has(paper.id) || existingTitles.has(titleKey)) continue;

    merged.push(paper);
    existingIds.add(paper.id);
    existingTitles.add(titleKey);
  }

  return deduplicatePapers(merged);
}

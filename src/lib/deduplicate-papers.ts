import { Paper } from "@/types/paper";

export function normalizePaperTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/^[\s\-–—•]+/, "")
    .replace(/[^\w\s가-힣]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function paperQualityScore(paper: Paper): number {
  let score = 0;
  score += paper.citationCount ?? 0;
  if (paper.openAlexId?.startsWith("W")) score += 50;
  if (paper.abstract && paper.abstract !== "Abstract not available for this paper.") {
    score += 20;
  }
  if (paper.pdfUrl) score += 5;
  return score;
}

function preferPaper<T extends Paper>(current: T, candidate: T): T {
  return paperQualityScore(candidate) > paperQualityScore(current)
    ? candidate
    : current;
}

export function deduplicatePapers<T extends Paper>(papers: T[]): T[] {
  const seenIds = new Set<string>();
  const titleToIndex = new Map<string, number>();
  const result: T[] = [];

  for (const paper of papers) {
    const idKey = (paper.openAlexId ?? paper.id).toLowerCase();
    const titleKey = normalizePaperTitle(paper.title);
    if (!titleKey) continue;

    if (seenIds.has(idKey)) continue;

    const existingIndex = titleToIndex.get(titleKey);
    if (existingIndex !== undefined) {
      const existing = result[existingIndex];
      const preferred = preferPaper(existing, paper);
      if (preferred !== existing) {
        seenIds.delete((existing.openAlexId ?? existing.id).toLowerCase());
        seenIds.add(idKey);
        result[existingIndex] = preferred;
      }
      continue;
    }

    seenIds.add(idKey);
    titleToIndex.set(titleKey, result.length);
    result.push(paper);
  }

  return result;
}

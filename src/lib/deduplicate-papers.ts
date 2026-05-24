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

const SIMILAR_NEWS_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "will",
  "are",
  "was",
  "has",
  "have",
  "its",
  "into",
  "over",
  "after",
  "about",
  "news",
  "says",
  "said",
  "report",
  "reports",
  "year",
  "annual",
  "fund",
  "pension",
  "investment",
  "returns",
  "return",
  "performance",
  "수익률",
  "연기금",
  "국민연금",
  "운용",
  "성과",
  "기금",
  "뉴스",
  "관련",
  "올해",
  "작년",
]);

function tokenizeNewsTitle(title: string): string[] {
  return normalizePaperTitle(title)
    .split(" ")
    .filter((word) => word.length > 2 && !SIMILAR_NEWS_STOP_WORDS.has(word));
}

export function areSimilarNewsTitles(a: string, b: string): boolean {
  const tokensA = tokenizeNewsTitle(a);
  const tokensB = tokenizeNewsTitle(b);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  if (union === 0) return false;

  const jaccard = intersection / union;
  if (jaccard >= 0.55) return true;

  const shorter = Math.min(setA.size, setB.size);
  return shorter > 0 && intersection / shorter >= 0.75;
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

export function deduplicateSimilarNews<T extends Paper>(
  papers: T[],
  prefer: (current: T, candidate: T) => T = preferPaper
): T[] {
  const result: T[] = [];

  for (const paper of papers) {
    const similarIndex = result.findIndex((existing) =>
      areSimilarNewsTitles(existing.title, paper.title)
    );

    if (similarIndex === -1) {
      result.push(paper);
      continue;
    }

    const preferred = prefer(result[similarIndex], paper);
    if (preferred !== result[similarIndex]) {
      result[similarIndex] = preferred;
    }
  }

  return result;
}

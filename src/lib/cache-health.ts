import { Paper } from "@/types/paper";
import { papers as curatedPapers } from "@/data/papers";

const CURATED_IDS = new Set(curatedPapers.map((paper) => paper.id));

/** OpenAlex/CrossRef + news 수집이 정상일 때 기대하는 최소 건수 */
export const MIN_HEALTHY_PAPER_COUNT = 40;

export function isCuratedOnlyCorpus(papers: Paper[]): boolean {
  return papers.length > 0 && papers.every((paper) => CURATED_IDS.has(paper.id));
}

export function isHealthyPaperCorpus(papers: Paper[]): boolean {
  return (
    papers.length >= MIN_HEALTHY_PAPER_COUNT && !isCuratedOnlyCorpus(papers)
  );
}

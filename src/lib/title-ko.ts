import { Paper } from "@/types/paper";
import { isKoreanPublication } from "./korean-publication";

export function isKoreanText(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text);
}

export function needsKoreanTitle(paper: {
  title: string;
  titleKo?: string;
  abstract?: string;
  journal?: string;
  countryCode?: string;
  originalUrl?: string;
  sourceSite?: string;
}): boolean {
  const titleKo = paper.titleKo?.trim() ?? "";
  const title = paper.title?.trim() ?? "";

  if (
    isKoreanPublication({
      title: paper.title,
      abstract: paper.abstract ?? "",
      journal: paper.journal ?? "",
      countryCode: paper.countryCode,
      originalUrl: paper.originalUrl ?? "",
      sourceSite: paper.sourceSite,
    })
  ) {
    return !isKoreanText(title) && !isKoreanText(titleKo);
  }

  if (!titleKo) return Boolean(title);
  if (titleKo === title) return !isKoreanText(titleKo);
  return !isKoreanText(titleKo);
}

export function getListDisplayTitle(paper: Paper): string {
  if (isKoreanPublication(paper)) {
    if (isKoreanText(paper.title)) return paper.title.trim();
    if (isKoreanText(paper.titleKo)) return paper.titleKo.trim();
  }

  const titleKo = paper.titleKo?.trim();
  if (titleKo && isKoreanText(titleKo)) return titleKo;
  if (titleKo && titleKo !== paper.title.trim()) return titleKo;
  return paper.title;
}

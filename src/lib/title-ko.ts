import { Paper } from "@/types/paper";

export function isKoreanText(text: string): boolean {
  return /[\uAC00-\uD7A3]/.test(text);
}

export function needsKoreanTitle(paper: {
  title: string;
  titleKo?: string;
}): boolean {
  const titleKo = paper.titleKo?.trim() ?? "";
  const title = paper.title?.trim() ?? "";
  if (!titleKo) return Boolean(title);
  if (titleKo === title) return !isKoreanText(titleKo);
  return !isKoreanText(titleKo);
}

export function getListDisplayTitle(paper: Paper): string {
  const titleKo = paper.titleKo?.trim();
  if (titleKo && isKoreanText(titleKo)) return titleKo;
  if (titleKo && titleKo !== paper.title.trim()) return titleKo;
  return paper.title;
}

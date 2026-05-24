import { Paper } from "@/types/paper";
import { isKoreanText } from "./title-ko";

const KOREAN_PUBLISHER_HOSTS = [
  "dbpia.co.kr",
  "kiss.kstudy.com",
  "riss.kr",
  "kci.go.kr",
  "koreascience.or.kr",
  "earticle.net",
  "synapsoft.co.kr",
  "kiss.ac.kr",
  "scholar.go.kr",
  "koreainfo.net",
  "koreascience.kr",
];

const KOREAN_PUBLISHER_PATTERNS = [
  /국민연금/,
  /한국연금/,
  /공적연금/,
  /한국금융연구원/,
  /한국경제연구/,
  /금융연구/,
  /재무연구/,
  /\bKCI\b/,
  /연기금.*한국/,
  /한국.*연기금/,
];

export function isKoreanPublisherUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (hostname.endsWith(".ac.kr") || hostname.endsWith(".go.kr")) return true;
    return KOREAN_PUBLISHER_HOSTS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

export function isKoreanPublication(
  paper: Pick<
    Paper,
    "title" | "abstract" | "journal" | "countryCode" | "originalUrl" | "sourceSite"
  >
): boolean {
  const text = `${paper.title} ${paper.abstract} ${paper.journal} ${paper.sourceSite ?? ""}`;

  if (isKoreanText(text)) return true;
  if (paper.countryCode?.toUpperCase() === "KR") return true;
  if (isKoreanPublisherUrl(paper.originalUrl)) return true;
  if (KOREAN_PUBLISHER_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  return false;
}

export function applyKoreanPublicationFields(paper: Paper): Paper {
  if (!isKoreanPublication(paper)) return paper;

  const titleKo = isKoreanText(paper.title)
    ? paper.title
    : isKoreanText(paper.titleKo)
      ? paper.titleKo
      : paper.titleKo;

  const abstractKo = isKoreanText(paper.abstract)
    ? paper.abstract
    : isKoreanText(paper.abstractKo)
      ? paper.abstractKo
      : paper.abstractKo;

  return {
    ...paper,
    titleKo,
    abstractKo,
    countryCode: paper.countryCode ?? "KR",
  };
}

export function getDisplayAbstractKo(paper: Paper): string {
  if (isKoreanText(paper.abstractKo)) return paper.abstractKo;
  if (isKoreanPublication(paper) && isKoreanText(paper.abstract)) {
    return paper.abstract;
  }
  return paper.abstractKo || paper.abstract;
}

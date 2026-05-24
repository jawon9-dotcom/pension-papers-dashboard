import { Paper } from "@/types/paper";
import { categorizePaper } from "./categorizer";
import { inferCountryFromText } from "./country";
import { getSourceSiteLabel } from "./source";
import { mapWithDelay } from "./fetch-utils";
import {
  buildYearFetchPlan,
  clampYearRange,
  DEFAULT_YEAR_FROM,
  FetchPeriod,
  getDefaultYearTo,
  pickRotatedQueries,
} from "./period";

const CROSSREF_BASE = "https://api.crossref.org/works";
const CONTACT_EMAIL =
  process.env.OPENALEX_EMAIL ?? "pension-dashboard@example.com";

const SEARCH_QUERIES = [
  "pension fund asset allocation",
  "pension fund investment strategy",
  "pension fund equity portfolio",
  "pension fund fixed income bond",
  "pension fund private equity alternative",
  "pension fund risk management",
  "pension fund performance attribution",
  "defined benefit pension liability driven investment",
  "public pension fund governance",
  "institutional pension portfolio management",
  "pension fund white paper",
  "retirement plan investment policy statement",
  "pension industry research report",
  "asset owner pension strategy",
  "pension fund annual investment report",
  "sovereign pension fund portfolio",
  "pension fund strategic asset allocation",
  "pension fund reference portfolio",
];

interface CrossRefAuthor {
  given?: string;
  family?: string;
}

interface CrossRefItem {
  DOI: string;
  title?: string[];
  author?: CrossRefAuthor[];
  published?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  abstract?: string;
  URL?: string;
  link?: { URL: string; "content-type"?: string }[];
  "is-referenced-by-count"?: number;
  type?: string;
}

interface CrossRefResponse {
  message: {
    items: CrossRefItem[];
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function isRelevant(title: string, abstract: string): boolean {
  const text = `${title} ${abstract}`.toLowerCase();
  const core = [
    "pension",
    "retirement",
    "superannuation",
    "provident fund",
    "endowment",
    "sovereign wealth",
    "public pension",
    "defined benefit",
  ];
  return core.some((kw) => text.includes(kw));
}

function getYear(
  item: CrossRefItem,
  yearFrom: number,
  yearTo: number
): number {
  const parts = item.published?.["date-parts"]?.[0];
  const year = parts?.[0] ?? 0;
  if (year < yearFrom || year > yearTo) return 0;
  return year;
}

function getAuthors(item: CrossRefItem): string[] {
  return (item.author ?? [])
    .map((a) => [a.given, a.family].filter(Boolean).join(" "))
    .filter(Boolean)
    .slice(0, 5);
}

function getPdfUrl(item: CrossRefItem): string | undefined {
  const pdf = item.link?.find(
    (l) => l["content-type"] === "application/pdf" || l.URL?.endsWith(".pdf")
  );
  return pdf?.URL;
}

function mapItemToPaper(
  item: CrossRefItem,
  yearFrom: number,
  yearTo: number
): Paper | null {
  const title = item.title?.[0]?.replace(/\s+/g, " ").trim();
  if (!title || !item.DOI) return null;

  const abstract = item.abstract ? stripHtml(item.abstract) : "";
  const year = getYear(item, yearFrom, yearTo);
  if (year === 0 || year < yearFrom || year > yearTo) return null;
  if (!isRelevant(title, abstract)) return null;

  const { category, subCategory } = categorizePaper(title, abstract);
  const id = item.DOI.replace(/^https?:\/\/doi.org\//, "").replace(/\//g, "_");
  const countryCode = inferCountryFromText(`${title} ${abstract}`);
  const originalUrl = item.URL ?? `https://doi.org/${item.DOI}`;

  return {
    id,
    openAlexId: id,
    title,
    titleKo: title,
    authors: getAuthors(item).length > 0 ? getAuthors(item) : ["Unknown"],
    year,
    journal: item["container-title"]?.[0] ?? "Academic Journal",
    category,
    subCategory,
    abstract: abstract || "Abstract not available for this paper.",
    abstractKo: abstract || "이 논문의 초록 정보가 제공되지 않습니다.",
    summaryKo: "",
    originalUrl,
    pdfUrl: getPdfUrl(item),
    hasAiSummary: false,
    countryCode,
    citationCount: item["is-referenced-by-count"] ?? 0,
    sourceSite: getSourceSiteLabel(originalUrl),
    publicationType: item.type?.replace(/-/g, " ") ?? undefined,
  };
}

async function fetchQuery(
  query: string,
  year: number,
  rows: number
): Promise<CrossRefItem[]> {
  const params = new URLSearchParams({
    query,
    rows: String(rows),
    sort: "published",
    order: "desc",
    filter: `from-pub-date:${year}-01-01,until-pub-date:${year}-12-31`,
  });

  const res = await fetch(`${CROSSREF_BASE}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": `PensionPapersDashboard/1.0 (mailto:${CONTACT_EMAIL})`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`CrossRef fetch failed for "${query}": ${res.status}`);
    return [];
  }

  const data = (await res.json()) as CrossRefResponse;
  return data.message?.items ?? [];
}

export async function fetchLatestPapers(
  period: FetchPeriod = clampYearRange(DEFAULT_YEAR_FROM, getDefaultYearTo())
): Promise<Paper[]> {
  const { years, maxTotal, queriesPerYear, perPage } = buildYearFetchPlan(
    period.yearFrom,
    period.yearTo,
    SEARCH_QUERIES.length
  );
  const seen = new Set<string>();
  const papers: Paper[] = [];

  for (const [index, year] of years.entries()) {
    if (papers.length >= maxTotal) break;

    const queries = pickRotatedQueries(
      SEARCH_QUERIES,
      index,
      queriesPerYear
    );
    const results = await mapWithDelay(queries, (query) =>
      fetchQuery(query, year, perPage)
    , 150);

    for (const batch of results) {
      for (const item of batch) {
        if (papers.length >= maxTotal) break;

        const doi = item.DOI;
        if (!doi || seen.has(doi)) continue;
        seen.add(doi);

        const paper = mapItemToPaper(item, period.yearFrom, period.yearTo);
        if (paper) papers.push(paper);
      }
    }
  }

  papers.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  return papers.slice(0, maxTotal);
}

export interface FetchMeta {
  source: "crossref" | "openalex" | "fallback";
  count: number;
  fetchedAt: string;
}

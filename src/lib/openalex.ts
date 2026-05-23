import { Paper } from "@/types/paper";
import { categorizePaper } from "./categorizer";
import { fetchLatestPapers as fetchFromCrossRef } from "./crossref";
import {
  extractCountryFromAuthorships,
  inferCountryFromText,
} from "./country";
import { getSourceSiteLabel, enrichPapers } from "./source";
import { mapWithDelay } from "./fetch-utils";
import {
  buildYearFetchPlan,
  clampYearRange,
  DEFAULT_YEAR_FROM,
  FetchPeriod,
  getDefaultYearTo,
  getMaxPapersForPeriod,
  pickRotatedQueries,
} from "./period";

const OPENALEX_BASE = "https://api.openalex.org/works";
const API_KEY = process.env.OPENALEX_API_KEY;
const MAILTO = process.env.OPENALEX_EMAIL ?? "pension-dashboard@example.com";

const BASE_FILTER_QUERIES = [
  "title.search:pension fund",
  "title.search:pension investment",
  "title.search:pension asset allocation",
  "title.search:pension risk management",
  "title.search:pension performance",
  "title.search:retirement fund investment",
  "title.search:defined benefit pension",
  "title.search:public pension",
];

interface OpenAlexWork {
  id: string;
  title: string;
  publication_year: number | null;
  abstract_inverted_index: Record<string, number[]> | null;
  doi: string | null;
  authorships: {
    author: { display_name: string };
    countries?: string[];
    institutions?: { country_code?: string }[];
  }[];
  primary_location: {
    source?: { display_name: string };
    landing_page_url?: string;
    pdf_url?: string;
  } | null;
  open_access?: { oa_url?: string };
  cited_by_count?: number;
}

interface OpenAlexResponse {
  results: OpenAlexWork[];
}

function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null
): string {
  if (!invertedIndex) return "";
  const tokens: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) tokens.push([pos, word]);
  }
  tokens.sort((a, b) => a[0] - b[0]);
  return tokens.map((t) => t[1]).join(" ");
}

function isRelevant(title: string, abstract: string): boolean {
  const text = `${title} ${abstract}`.toLowerCase();
  const core = ["pension", "retirement", "superannuation", "provident fund"];
  if (!core.some((kw) => text.includes(kw))) return false;

  const financeCtx = [
    "fund",
    "investment",
    "portfolio",
    "asset",
    "return",
    "risk",
    "allocation",
    "benefit",
    "liability",
    "governance",
  ];
  return financeCtx.some((kw) => text.includes(kw));
}

function mapWorkToPaper(
  work: OpenAlexWork,
  yearFrom: number,
  yearTo: number
): Paper | null {
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const title = work.title?.replace(/\s+/g, " ").trim();
  if (!title) return null;

  const year = work.publication_year ?? new Date().getFullYear();
  if (year < yearFrom || year > yearTo) return null;
  if (!isRelevant(title, abstract)) return null;

  const { category, subCategory } = categorizePaper(title, abstract);
  const oaId = work.id.replace("https://openalex.org/", "");
  const countryCode =
    extractCountryFromAuthorships(work.authorships) ??
    inferCountryFromText(`${title} ${abstract}`);

  const originalUrl =
    work.primary_location?.landing_page_url ??
    work.doi ??
    work.open_access?.oa_url ??
    `https://openalex.org/${oaId}`;

  return {
    id: oaId,
    openAlexId: oaId,
    title,
    titleKo: title,
    authors:
      work.authorships
        .map((a) => a.author?.display_name)
        .filter(Boolean)
        .slice(0, 5) || ["Unknown"],
    year,
    journal: work.primary_location?.source?.display_name ?? "Academic Journal",
    category,
    subCategory,
    abstract: abstract || "Abstract not available for this paper.",
    abstractKo: abstract || "이 논문의 초록 정보가 제공되지 않습니다.",
    summaryKo: "",
    originalUrl,
    pdfUrl:
      work.primary_location?.pdf_url ?? work.open_access?.oa_url ?? undefined,
    hasAiSummary: false,
    countryCode,
    citationCount: work.cited_by_count ?? 0,
    sourceSite: getSourceSiteLabel(originalUrl),
  };
}

async function fetchOpenAlexFilter(
  filter: string,
  perPage: number
): Promise<OpenAlexWork[]> {
  const params = new URLSearchParams({
    filter,
    sort: "publication_date:desc",
    per_page: String(perPage),
    mailto: MAILTO,
  });
  if (API_KEY) params.set("api_key", API_KEY);

  const res = await fetch(`${OPENALEX_BASE}?${params}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`OpenAlex filter failed [${filter}]: ${res.status}`);
    return [];
  }

  const data = (await res.json()) as OpenAlexResponse;
  return data.results ?? [];
}

async function fetchFromOpenAlex(period: FetchPeriod): Promise<Paper[]> {
  const { years, maxTotal, queriesPerYear, perPage } = buildYearFetchPlan(
    period.yearFrom,
    period.yearTo,
    BASE_FILTER_QUERIES.length
  );
  const seen = new Set<string>();
  const papers: Paper[] = [];

  for (const [index, year] of years.entries()) {
    if (papers.length >= maxTotal) break;

    const queries = pickRotatedQueries(
      BASE_FILTER_QUERIES,
      index,
      queriesPerYear
    );
    const filters = queries.map((query) => `${query},publication_year:${year}`);
    const results = await mapWithDelay(filters, (filter) =>
      fetchOpenAlexFilter(filter, perPage)
    );

    for (const batch of results) {
      for (const work of batch) {
        if (papers.length >= maxTotal) break;

        const id = work.id.replace("https://openalex.org/", "");
        if (seen.has(id)) continue;
        seen.add(id);

        const paper = mapWorkToPaper(work, period.yearFrom, period.yearTo);
        if (paper) papers.push(paper);
      }
    }
  }

  return papers;
}

/** OpenAlex filter(주) + CrossRef(보조) 병합 수집 */
export async function fetchLatestPapers(
  options?: Partial<FetchPeriod>
): Promise<Paper[]> {
  const period = clampYearRange(
    options?.yearFrom ?? DEFAULT_YEAR_FROM,
    options?.yearTo ?? getDefaultYearTo()
  );

  const openalexPapers = await fetchFromOpenAlex(period);
  const maxTotal = getMaxPapersForPeriod(period.yearFrom, period.yearTo);

  if (openalexPapers.length >= Math.min(maxTotal, 24)) {
    return enrichPapers(openalexPapers.slice(0, maxTotal));
  }

  const crossrefPapers = await fetchFromCrossRef(period);
  const seen = new Set<string>();
  const merged: Paper[] = [];

  for (const paper of [...openalexPapers, ...crossrefPapers]) {
    const key = paper.id;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(paper);
  }

  merged.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  return enrichPapers(merged.slice(0, maxTotal));
}

export interface FetchMeta {
  source: "openalex" | "crossref" | "mixed" | "fallback";
  count: number;
  fetchedAt: string;
  yearFrom?: number;
  yearTo?: number;
}

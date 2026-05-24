import { Paper } from "@/types/paper";
import { categorizePaper } from "./categorizer";
import { inferCountryFromText } from "./country";
import { getSourceSiteLabel } from "./source";
import { mapWithDelay } from "./fetch-utils";
import { getCrossRefFetchDelayMs } from "./server-env";
import {
  buildYearFetchPlan,
  clampYearRange,
  DEFAULT_YEAR_FROM,
  FetchPeriod,
  getDefaultYearTo,
  pickRotatedQueries,
} from "./period";
import { isPaperRelevant, RelevanceMode } from "./relevance";

const CROSSREF_BASE = "https://api.crossref.org/works";
const CONTACT_EMAIL =
  process.env.OPENALEX_EMAIL ?? "pension-dashboard@example.com";

interface CrossRefQuerySpec {
  query: string;
  mode: RelevanceMode;
}

function interleaveCrossRefQueries(
  specs: CrossRefQuerySpec[]
): CrossRefQuerySpec[] {
  const academic = specs.filter((spec) => spec.mode === "default");
  const industry = specs.filter((spec) => spec.mode === "industry");
  const tpa = specs.filter((spec) => spec.mode === "tpa");
  const interleaved: CrossRefQuerySpec[] = [];
  const maxLen = Math.max(academic.length, industry.length, tpa.length);

  for (let index = 0; index < maxLen; index++) {
    if (academic[index]) interleaved.push(academic[index]);
    if (industry[index]) interleaved.push(industry[index]);
    if (tpa[index]) interleaved.push(tpa[index]);
  }

  return interleaved;
}

const SEARCH_QUERY_SPECS: CrossRefQuerySpec[] = interleaveCrossRefQueries([
  { query: "pension fund asset allocation", mode: "default" },
  { query: "pension fund investment strategy", mode: "default" },
  { query: "pension fund equity portfolio", mode: "default" },
  { query: "pension fund fixed income bond", mode: "default" },
  { query: "pension fund private equity alternative", mode: "default" },
  { query: "pension fund risk management", mode: "default" },
  { query: "pension fund performance attribution", mode: "default" },
  {
    query: "defined benefit pension liability driven investment",
    mode: "default",
  },
  { query: "public pension fund governance", mode: "default" },
  { query: "institutional pension portfolio management", mode: "default" },
  { query: "pension fund white paper", mode: "industry" },
  { query: "pension industry research report", mode: "industry" },
  { query: "retirement plan investment policy statement", mode: "industry" },
  { query: "asset owner pension strategy", mode: "industry" },
  { query: "pension fund annual investment report", mode: "industry" },
  { query: "sovereign pension fund portfolio", mode: "industry" },
  { query: "pension fund strategic asset allocation", mode: "default" },
  { query: "pension fund reference portfolio", mode: "tpa" },
  { query: "total portfolio approach pension", mode: "tpa" },
  { query: "total portfolio approach asset owner", mode: "tpa" },
  { query: "reference portfolio institutional investor", mode: "tpa" },
  { query: "reference portfolio white paper", mode: "tpa" },
]);

const CORE_CROSSREF_QUERIES: CrossRefQuerySpec[] = [
  { query: "pension fund asset allocation", mode: "default" },
  { query: "pension fund white paper", mode: "industry" },
  { query: "pension industry research report", mode: "industry" },
  { query: "total portfolio approach pension", mode: "tpa" },
  { query: "pension fund reference portfolio", mode: "tpa" },
  { query: "reference portfolio asset owner", mode: "tpa" },
];

function buildCrossRefYearQueries(
  yearIndex: number,
  queriesPerYear: number
): CrossRefQuerySpec[] {
  const coreKeys = new Set(
    CORE_CROSSREF_QUERIES.map((spec) => `${spec.mode}:${spec.query}`)
  );
  const extras = SEARCH_QUERY_SPECS.filter(
    (spec) => !coreKeys.has(`${spec.mode}:${spec.query}`)
  );
  const rotatedExtras = pickRotatedQueries(
    extras,
    yearIndex,
    Math.max(0, queriesPerYear - CORE_CROSSREF_QUERIES.length)
  );

  return [...CORE_CROSSREF_QUERIES, ...rotatedExtras];
}

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

function cleanTitle(title: string): string {
  return stripHtml(title);
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
  yearTo: number,
  mode: RelevanceMode
): Paper | null {
  const title = cleanTitle(item.title?.[0] ?? "");
  if (!title || !item.DOI) return null;

  const abstract = item.abstract ? stripHtml(item.abstract) : "";
  const year = getYear(item, yearFrom, yearTo);
  if (year === 0 || year < yearFrom || year > yearTo) return null;

  const publicationType = item.type?.replace(/-/g, " ") ?? undefined;
  if (!isPaperRelevant(title, abstract, mode, item.type ?? undefined)) {
    return null;
  }

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
    publicationType,
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
    SEARCH_QUERY_SPECS.length
  );
  const seen = new Set<string>();
  const seenTitles = new Set<string>();
  const papers: Paper[] = [];

  for (const [index, year] of years.entries()) {
    if (papers.length >= maxTotal) break;

    const querySpecs = buildCrossRefYearQueries(index, queriesPerYear);
    const results = await mapWithDelay(
      querySpecs,
      (spec) =>
        fetchQuery(spec.query, year, perPage).then((items) => ({
          items,
          mode: spec.mode,
        })),
      getCrossRefFetchDelayMs()
    );

    for (const batch of results) {
      for (const item of batch.items) {
        if (papers.length >= maxTotal) break;

        const doi = item.DOI;
        if (!doi || seen.has(doi)) continue;

        const paper = mapItemToPaper(
          item,
          period.yearFrom,
          period.yearTo,
          batch.mode
        );
        if (!paper) continue;

        const titleKey = paper.title.trim().toLowerCase();
        if (seenTitles.has(titleKey)) continue;

        seen.add(doi);
        seenTitles.add(titleKey);
        papers.push(paper);
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

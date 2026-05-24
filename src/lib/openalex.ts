import { Paper } from "@/types/paper";
import { categorizePaper } from "./categorizer";
import { fetchLatestPapers as fetchFromCrossRef } from "./crossref";
import {
  extractCountryFromAuthorships,
  inferCountryFromText,
} from "./country";
import { getSourceSiteLabel, enrichPapers } from "./source";
import { mapWithDelay } from "./fetch-utils";
import { getFetchDelayMs } from "./server-env";
import {
  buildYearFetchPlan,
  clampYearRange,
  DEFAULT_YEAR_FROM,
  FetchPeriod,
  getDefaultYearTo,
  getMaxPapersForPeriod,
  pickRotatedQueries,
} from "./period";
import { isPaperRelevant, RelevanceMode, scorePaperRelevance } from "./relevance";
import { filterExcludedRegionPapers } from "./paper-region-filter";
import { mergeCuratedPapers } from "./curated-papers";
import { normalizePaperTitle } from "./deduplicate-papers";
import {
  PRIORITY_REGION_OPENALEX_QUERIES,
} from "./priority-regions";
import { KOREA_OPENALEX_QUERIES } from "./korea-regions";
import {
  GLOBAL_TREND_OPENALEX_QUERIES,
  hasGlobalPensionTrendSignal,
} from "./global-pension-trends";
import { isKoreanPublication } from "./korean-publication";
import {
  appendTpaNewsArticles,
  fetchPerformanceEvaluationNewsArticles,
  fetchTpaNewsArticles,
} from "./tpa-news";

const OPENALEX_BASE = "https://api.openalex.org/works";
const API_KEY = process.env.OPENALEX_API_KEY;
const MAILTO = process.env.OPENALEX_EMAIL ?? "pension-dashboard@example.com";

interface OpenAlexQuerySpec {
  filter: string;
  mode: RelevanceMode;
}

function interleaveQuerySpecs(
  specs: OpenAlexQuerySpec[]
): OpenAlexQuerySpec[] {
  const academic = specs.filter((spec) => spec.mode === "default");
  const industry = specs.filter((spec) => spec.mode === "industry");
  const tpa = specs.filter((spec) => spec.mode === "tpa");
  const priority = specs.filter((spec) => spec.mode === "priority");
  const korea = specs.filter((spec) => spec.mode === "korea");
  const globalTrend = specs.filter((spec) => spec.mode === "global-trend");
  const interleaved: OpenAlexQuerySpec[] = [];
  const maxLen = Math.max(
    academic.length,
    industry.length,
    tpa.length,
    priority.length,
    korea.length,
    globalTrend.length
  );

  for (let index = 0; index < maxLen; index++) {
    if (globalTrend[index]) interleaved.push(globalTrend[index]);
    if (priority[index]) interleaved.push(priority[index]);
    if (korea[index]) interleaved.push(korea[index]);
    if (academic[index]) interleaved.push(academic[index]);
    if (industry[index]) interleaved.push(industry[index]);
    if (tpa[index]) interleaved.push(tpa[index]);
  }

  return interleaved;
}

const OPENALEX_QUERY_SPECS: OpenAlexQuerySpec[] = interleaveQuerySpecs([
  ...GLOBAL_TREND_OPENALEX_QUERIES,
  ...KOREA_OPENALEX_QUERIES,
  ...PRIORITY_REGION_OPENALEX_QUERIES,
  { filter: "title.search:pension fund", mode: "default" },
  { filter: "title.search:pension investment", mode: "default" },
  { filter: "title.search:pension asset allocation", mode: "default" },
  { filter: "title.search:strategic asset allocation pension", mode: "default" },
  { filter: "title.search:tactical asset allocation pension", mode: "default" },
  { filter: "title.search:benchmark pension fund manager evaluation", mode: "default" },
  { filter: "title.search:factor based asset allocation pension", mode: "default" },
  { filter: "title.search:strategic asset allocation public pension", mode: "default" },
  { filter: "default.search:strategic asset allocation pension fund", mode: "default" },
  { filter: "default.search:tactical asset allocation pension fund", mode: "default" },
  { filter: "default.search:benchmark design pension assets", mode: "default" },
  { filter: "default.search:manager evaluation pension fund benchmark", mode: "default" },
  { filter: "default.search:factor based asset allocation global pension", mode: "default" },
  { filter: "title.search:pension risk management", mode: "default" },
  { filter: "title.search:pension performance", mode: "default" },
  { filter: "title.search:retirement fund investment", mode: "default" },
  { filter: "title.search:defined benefit pension", mode: "default" },
  { filter: "title.search:public pension", mode: "default" },
  { filter: "title.search:pension fund strategy", mode: "default" },
  { filter: "title.search:pension portfolio policy", mode: "default" },
  { filter: "title.search:portfolio management pension", mode: "default" },
  { filter: "title.search:investment strategy pension fund", mode: "default" },
  { filter: "default.search:portfolio management institutional investor", mode: "default" },
  { filter: "title.search:national pension fund", mode: "default" },
  { filter: "default.search:pension fund economics", mode: "default" },
  { filter: "default.search:pension fund finance", mode: "default" },
  { filter: "default.search:asset management pension", mode: "default" },
  { filter: "default.search:accounting pension fund", mode: "default" },
  { filter: "default.search:quantitative portfolio institutional", mode: "default" },
  { filter: "default.search:pension fund mathematics", mode: "default" },
  {
    filter: "title.search:pension fund white paper,type:report|preprint",
    mode: "industry",
  },
  {
    filter: "title.search:pension industry research,type:report|article|preprint",
    mode: "industry",
  },
  {
    filter: "title.search:asset owner pension strategy,type:report|article|preprint",
    mode: "industry",
  },
  {
    filter: "title.search:retirement plan investment policy,type:report|article",
    mode: "industry",
  },
  {
    filter: "title.search:institutional investor pension,type:report|article|preprint",
    mode: "industry",
  },
  {
    filter: "title.search:sovereign pension fund,type:report|article|preprint",
    mode: "industry",
  },
  {
    filter: "title.search:pension fund annual report,type:report|preprint",
    mode: "industry",
  },
  {
    filter:
      "title.search:total portfolio approach,type:report|article|preprint",
    mode: "tpa",
  },
  {
    filter: "title.search:reference portfolio,type:report|article|preprint",
    mode: "tpa",
  },
  {
    filter:
      "default.search:total portfolio approach pension,type:report|article|preprint",
    mode: "tpa",
  },
  {
    filter:
      "default.search:reference portfolio asset owner,type:report|article|preprint",
    mode: "tpa",
  },
  {
    filter:
      "default.search:reference portfolio institutional investor,type:report|article|preprint",
    mode: "tpa",
  },
]);

const CORE_OPENALEX_QUERIES: OpenAlexQuerySpec[] = [
  { filter: "title.search:pension fund private equity", mode: "global-trend" },
  { filter: "title.search:pension fund alternative investment", mode: "global-trend" },
  { filter: "title.search:factor based asset allocation pension", mode: "global-trend" },
  { filter: "title.search:national pension service korea", mode: "korea" },
  { filter: "title.search:korea pension fund asset allocation", mode: "korea" },
  { filter: "default.search:pension fund asset allocation,authorships.institutions.country_code:kr", mode: "korea" },
  { filter: "title.search:calpers pension asset allocation", mode: "priority" },
  { filter: "title.search:cppib pension portfolio", mode: "priority" },
  { filter: "title.search:gpif pension asset allocation", mode: "priority" },
  { filter: "title.search:australian super fund pension", mode: "priority" },
  { filter: "title.search:new zealand super fund pension", mode: "priority" },
  { filter: "title.search:pension fund", mode: "default" },
  { filter: "title.search:national pension fund", mode: "default" },
  { filter: "title.search:pension investment", mode: "default" },
  {
    filter: "title.search:pension fund white paper,type:report|preprint",
    mode: "industry",
  },
  {
    filter: "title.search:pension industry research,type:report|article|preprint",
    mode: "industry",
  },
  {
    filter:
      "title.search:total portfolio approach,type:report|article|preprint",
    mode: "tpa",
  },
  {
    filter:
      "default.search:total portfolio approach pension,type:report|article|preprint",
    mode: "tpa",
  },
  {
    filter:
      "default.search:reference portfolio asset owner,type:report|article|preprint",
    mode: "tpa",
  },
];

function buildYearQueries(
  yearIndex: number,
  queriesPerYear: number
): OpenAlexQuerySpec[] {
  const coreKeys = new Set(
    CORE_OPENALEX_QUERIES.map((spec) => `${spec.mode}:${spec.filter}`)
  );
  const extras = OPENALEX_QUERY_SPECS.filter(
    (spec) => !coreKeys.has(`${spec.mode}:${spec.filter}`)
  );
  const rotatedExtras = pickRotatedQueries(
    extras,
    yearIndex,
    Math.max(0, queriesPerYear - CORE_OPENALEX_QUERIES.length)
  );

  return [...CORE_OPENALEX_QUERIES, ...rotatedExtras];
}

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
  type?: string;
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

function cleanTitle(title: string): string {
  return title
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function mapWorkToPaper(
  work: OpenAlexWork,
  yearFrom: number,
  yearTo: number,
  mode: RelevanceMode
): Paper | null {
  const abstract = reconstructAbstract(work.abstract_inverted_index);
  const title = cleanTitle(work.title ?? "");
  if (!title) return null;

  const year = work.publication_year ?? new Date().getFullYear();
  if (year < yearFrom || year > yearTo) return null;

  const publicationType = work.type?.replace(/-/g, " ") ?? undefined;
  if (!isPaperRelevant(title, abstract, mode, work.type ?? undefined)) {
    return null;
  }

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
    publicationType,
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
    OPENALEX_QUERY_SPECS.length
  );
  const seen = new Set<string>();
  const papers: Paper[] = [];

  for (const [index, year] of years.entries()) {
    if (papers.length >= maxTotal) break;

    const querySpecs = buildYearQueries(index, queriesPerYear);
    const filters = querySpecs.map(
      (spec) => `${spec.filter},publication_year:${year}`
    );
    const results = await mapWithDelay(
      filters,
      (filter, queryIndex) =>
        fetchOpenAlexFilter(filter, perPage).then((works) => ({
          works,
          mode: querySpecs[queryIndex]?.mode ?? "default",
        })),
      getFetchDelayMs()
    );

    for (const batch of results) {
      for (const work of batch.works) {
        if (papers.length >= maxTotal) break;

        const id = work.id.replace("https://openalex.org/", "");
        if (seen.has(id)) continue;
        seen.add(id);

        const paper = mapWorkToPaper(
          work,
          period.yearFrom,
          period.yearTo,
          batch.mode
        );
        if (paper) papers.push(paper);
      }
    }
  }

  return papers;
}

function mergePaperLists(
  lists: Paper[][],
  maxTotal: number
): Paper[] {
  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const merged: Paper[] = [];

  for (const list of lists) {
    for (const paper of list) {
      if (merged.length >= maxTotal) break;

      const idKey = paper.openAlexId ?? paper.id;
      const titleKey = normalizePaperTitle(paper.title);
      if (!titleKey || seenIds.has(idKey) || seenTitles.has(titleKey)) continue;

      seenIds.add(idKey);
      seenTitles.add(titleKey);
      merged.push(paper);
    }
  }

  merged.sort((a, b) => {
    const aTrend = hasGlobalPensionTrendSignal(`${a.title} ${a.abstract}`) ? 1 : 0;
    const bTrend = hasGlobalPensionTrendSignal(`${b.title} ${b.abstract}`) ? 1 : 0;
    if (bTrend !== aTrend) return bTrend - aTrend;

    const aKr = isKoreanPublication(a) ? 1 : 0;
    const bKr = isKoreanPublication(b) ? 1 : 0;
    if (bKr !== aKr) return bKr - aKr;

    const citationDiff = (b.citationCount ?? 0) - (a.citationCount ?? 0);
    const relevanceDiff =
      scorePaperRelevance(b.title, b.abstract) -
      scorePaperRelevance(a.title, a.abstract);
    return (
      citationDiff ||
      b.year - a.year ||
      relevanceDiff ||
      a.title.localeCompare(b.title)
    );
  });
  return merged;
}

/** OpenAlex + CrossRef 항상 병합 수집 */
export async function fetchLatestPapers(
  options?: Partial<FetchPeriod>
): Promise<Paper[]> {
  const period = clampYearRange(
    options?.yearFrom ?? DEFAULT_YEAR_FROM,
    options?.yearTo ?? getDefaultYearTo()
  );
  const maxTotal = getMaxPapersForPeriod(period.yearFrom, period.yearTo);

  const [openalexPapers, crossrefPapers, tpaNewsArticles, performanceNewsArticles] =
    await Promise.all([
    fetchFromOpenAlex(period),
    fetchFromCrossRef(period),
    fetchTpaNewsArticles(period),
    fetchPerformanceEvaluationNewsArticles(period),
  ]);

  const merged = mergePaperLists(
    [openalexPapers, crossrefPapers],
    maxTotal
  );

  return enrichPapers(
    appendTpaNewsArticles(
      appendTpaNewsArticles(
        mergeCuratedPapers(filterExcludedRegionPapers(merged), period),
        tpaNewsArticles
      ),
      performanceNewsArticles
    )
  );
}

export interface FetchMeta {
  source: "openalex" | "crossref" | "mixed" | "fallback";
  count: number;
  fetchedAt: string;
  yearFrom?: number;
  yearTo?: number;
}

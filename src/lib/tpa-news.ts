import { Paper, MainCategory, SubCategory } from "@/types/paper";
import { inferCountryFromText } from "./country";
import { getSourceSiteLabel } from "./source";
import { FetchPeriod, MAX_KOREA_DOMESTIC_NEWS, TPA_NEWS_MAX } from "./period";
import { hasTrueTpaSignal } from "./relevance";
import { isExcludedRegionPaper } from "./paper-region-filter";
import {
  hasSaaSignal,
  hasTaaSignal,
  resolveSaaTaaSubCategory,
} from "./allocation-signals";
import { PRIORITY_REGION_NEWS_SEARCHES } from "./priority-regions";
import {
  KOREA_GOOGLE_NEWS_RSS_SEARCHES,
  KOREA_NPS_NEWS_SEARCHES,
  hasKoreaPensionSignal,
} from "./korea-regions";
import {
  GLOBAL_GOOGLE_NEWS_RSS_SEARCHES,
  GLOBAL_PENSION_TREND_NEWS_SEARCHES,
  hasGlobalPensionTrendSignal,
  isGlobalPensionNews,
  isKoreaDomesticNews,
} from "./global-pension-trends";
import { isServerlessEnv } from "./server-env";

const GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc";
const NEWS_API_BASE = "https://newsapi.org/v2/everything";

const PENSION_NEWS_SEARCHES = [
  ...GLOBAL_PENSION_TREND_NEWS_SEARCHES,
  ...PRIORITY_REGION_NEWS_SEARCHES,
  "total portfolio approach pension",
  "reference portfolio pension fund",
  "reference portfolio asset owner",
  "strategic asset allocation pension",
  "tactical asset allocation pension fund",
  "pension fund strategic asset allocation",
  "pension fund tactical asset allocation",
  "pension fund investment strategy",
  "pension fund portfolio management",
  "national pension fund investment",
  "global pension fund portfolio",
  "institutional pension portfolio",
  "sovereign pension fund investment",
  "public pension asset allocation",
  ...KOREA_NPS_NEWS_SEARCHES,
  "국민연금 운용",
  "연기금 투자 전략",
  "연기금 포트폴리오",
  "연기금 전략적 자산배분",
  "연기금 전술적 자산배분",
  "공적연금 자산운용",
];

const KOREAN_TRUSTED_NEWS_DOMAINS = [
  "mk.co.kr",
  "maekyung.com",
  "hankyung.com",
  "fnnews.com",
  "sedaily.com",
  "edaily.co.kr",
  "etnews.com",
  "mt.co.kr",
  "news1.kr",
  "yna.co.kr",
  "yonhapnews.co.kr",
  "einfomax.co.kr",
  "etoday.co.kr",
  "bizwatch.co.kr",
  "koreaherald.com",
  "koreatimes.co.kr",
  "thebell.co.kr",
  "nspna.com",
  "nps.or.kr",
  "nps.go.kr",
  "newsis.com",
  "newspim.com",
  "ajunews.com",
  "heraldcorp.com",
  "hankookilbo.com",
  "donga.com",
  "chosun.com",
  "joins.com",
  "joongang.co.kr",
];

const BLOCKED_NEWS_DOMAINS = [
  "reddit.com",
  "quora.com",
  "pinterest.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "medium.com",
  "blogspot.com",
  "wordpress.com",
  "substack.com",
  "seekingalpha.com",
  "fool.com",
  "zerohedge.com",
  "beforeitsnews.com",
  "naturalnews.com",
  "thedailybeast.com",
  "buzzfeed.com",
  "dailymail.co.uk",
  "mirror.co.uk",
  "express.co.uk",
  "thesun.co.uk",
  "nypost.com",
  "breitbart.com",
  "infowars.com",
  "worldtruth.tv",
  "yournewswire.com",
  "activistpost.com",
];

const FINANCIAL_NEWS_DOMAINS = [
  "ft.com",
  "bloomberg.com",
  "reuters.com",
  "institutionalinvestor.com",
  "ai-cio.com",
  "top1000funds.com",
  "pionline.com",
  "ipe.com",
  "citywire.com",
  "economist.com",
  "wsj.com",
  "cnbc.com",
  "marketwatch.com",
  "wealthmanagement.com",
  "investordaily.com.au",
  "superreview.com.au",
  "troweprice.com",
  "blackrock.com",
  "invesco.com",
  "cppinvestments.com",
  "calpers.ca.gov",
  "marketsgroup.org",
  "mercer.com",
  "willistowerswatson.com",
  "russellinvestments.com",
  "manulifeim.com",
  "mackenzieinvestments.com",
];

const DOMAIN_POPULARITY: Record<string, number> = {
  "ft.com": 100,
  "bloomberg.com": 98,
  "reuters.com": 95,
  "wsj.com": 94,
  "economist.com": 90,
  "cnbc.com": 85,
  "institutionalinvestor.com": 88,
  "pionline.com": 86,
  "ipe.com": 84,
  "ai-cio.com": 82,
  "top1000funds.com": 80,
  "citywire.com": 78,
  "marketwatch.com": 76,
  "wealthmanagement.com": 77,
  "investordaily.com.au": 74,
  "superreview.com.au": 72,
  "mk.co.kr": 70,
  "hankyung.com": 68,
  "fnnews.com": 66,
  "sedaily.com": 65,
  "edaily.co.kr": 64,
  "yna.co.kr": 72,
};

interface GdeltArticle {
  url?: string;
  title?: string;
  seendate?: string;
  domain?: string;
  language?: string;
  sourcecountry?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

interface NewsApiArticle {
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;
  source?: { name?: string };
}

interface NewsApiResponse {
  articles?: NewsApiArticle[];
  totalResults?: number;
}

function hashUrl(url: string): string {
  let hash = 0;
  for (let index = 0; index < url.length; index++) {
    hash = (hash << 5) - hash + url.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function cleanTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

function parseGdeltYear(seenDate?: string): number {
  if (!seenDate || seenDate.length < 4) return new Date().getFullYear();
  return Number(seenDate.slice(0, 4)) || new Date().getFullYear();
}

function parseIsoYear(iso?: string): number {
  if (!iso) return new Date().getFullYear();
  const year = Number(iso.slice(0, 4));
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function toIsoDateString(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return date.toISOString();
}

function parseGdeltPublishedAt(seenDate?: string): string | undefined {
  if (!seenDate || seenDate.length < 8) return undefined;
  const year = seenDate.slice(0, 4);
  const month = seenDate.slice(4, 6);
  const day = seenDate.slice(6, 8);
  return toIsoDateString(`${year}-${month}-${day}T12:00:00Z`);
}

function getDomainPopularity(domain?: string): number {
  if (!domain) return 40;
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  return DOMAIN_POPULARITY[normalized] ?? 45;
}

function isFinancialNewsDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return FINANCIAL_NEWS_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function normalizeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function isBlockedNewsDomain(hostname: string): boolean {
  return BLOCKED_NEWS_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

function isKoreanTrustedNewsDomain(url: string): boolean {
  const hostname = normalizeHostname(url);
  if (!hostname) return false;
  return KOREAN_TRUSTED_NEWS_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
}

function isTrustedNewsPublisher(
  url: string,
  title = "",
  description = ""
): boolean {
  const hostname = normalizeHostname(url);
  if (!hostname) return false;
  if (isBlockedNewsDomain(hostname)) return false;
  if (isFinancialNewsDomain(url) || isKoreanTrustedNewsDomain(url)) return true;

  const text = `${title} ${description}`.toLowerCase();
  if (hasTrueTpaSignal(title, text)) return true;

  return false;
}

function isPensionNewsCandidate(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();

  if (hasTrueTpaSignal(title, text)) return true;
  if (hasGlobalPensionTrendSignal(`${title} ${description}`)) return true;
  if (text.includes("국민연금")) return true;
  if (hasKoreaPensionSignal(`${title} ${description}`)) {
    return (
      text.includes("invest") ||
      text.includes("portfolio") ||
      text.includes("asset") ||
      text.includes("fund") ||
      text.includes("allocation") ||
      text.includes("strategy") ||
      text.includes("운용") ||
      text.includes("투자") ||
      text.includes("포트폴리오") ||
      text.includes("자산") ||
      text.includes("배분") ||
      text.includes("수익") ||
      text.includes("기금")
    );
  }

  const hasPensionContext =
    text.includes("pension") ||
    text.includes("retirement") ||
    text.includes("superannuation") ||
    text.includes("provident fund") ||
    text.includes("national pension") ||
    text.includes("public pension") ||
    text.includes("sovereign pension") ||
    text.includes("연기금") ||
    text.includes("국민연금") ||
    text.includes("공적연금") ||
    text.includes("퇴직연금");

  if (!hasPensionContext) return false;

  return (
    text.includes("fund") ||
    text.includes("invest") ||
    text.includes("portfolio") ||
    text.includes("asset") ||
    text.includes("allocation") ||
    text.includes("strategy") ||
    text.includes("manager") ||
    text.includes("institutional") ||
    text.includes("sovereign") ||
    text.includes("asset owner") ||
    text.includes("운용") ||
    text.includes("투자") ||
    text.includes("포트폴리오") ||
    text.includes("자산")
  );
}

function categorizeNewsArticle(
  title: string,
  description: string
): { category: MainCategory; subCategory: SubCategory } {
  const text = `${title} ${description}`.toLowerCase();

  if (hasTrueTpaSignal(title, text)) {
    return { category: "asset-allocation", subCategory: "tpa" };
  }

  const saaTaa = resolveSaaTaaSubCategory(title, text);
  if (saaTaa) {
    return { category: "asset-allocation", subCategory: saaTaa };
  }

  if (hasSaaSignal(title, text)) {
    return { category: "asset-allocation", subCategory: "saa" };
  }

  if (hasTaaSignal(title, text)) {
    return { category: "asset-allocation", subCategory: "taa" };
  }

  if (
    (text.includes("factor") || text.includes("팩터")) &&
    (text.includes("allocation") ||
      text.includes("investing") ||
      text.includes("자산배분") ||
      text.includes("운용"))
  ) {
    return { category: "asset-allocation", subCategory: "saa" };
  }

  if (
    text.includes("private equity") ||
    text.includes("alternative investment") ||
    text.includes("alternatives") ||
    text.includes("real estate fund") ||
    text.includes("infrastructure fund") ||
    text.includes("hedge fund") ||
    text.includes("대체투자") ||
    text.includes("사모펀드") ||
    text.includes("인프라")
  ) {
    return { category: "asset-management", subCategory: "alternative" };
  }

  if (
    text.includes("fixed income") ||
    text.includes("bond fund") ||
    text.includes("bond market") ||
    text.includes(" bond ") ||
    text.includes("채권") ||
    text.includes("금리")
  ) {
    return { category: "asset-management", subCategory: "bond" };
  }

  if (
    text.includes("equity") ||
    text.includes("stock market") ||
    text.includes(" stock ") ||
    text.includes("share ") ||
    text.includes("주식") ||
    text.includes("증시")
  ) {
    return { category: "asset-management", subCategory: "equity" };
  }

  if (
    text.includes("portfolio management") ||
    text.includes("investment strategy") ||
    text.includes("asset management") ||
    text.includes("fund manager") ||
    text.includes("투자전략") ||
    text.includes("운용전략")
  ) {
    return { category: "asset-management", subCategory: "equity" };
  }

  return { category: "asset-allocation", subCategory: "strategy-general" };
}

function mapNewsToPaper(
  input: {
    title: string;
    url: string;
    year: number;
    description: string;
    sourceLabel: string;
    popularityScore: number;
    idPrefix: string;
    publisherUrl?: string;
    publishedAt?: string;
  },
  period: FetchPeriod
): Paper | null {
  const title = cleanTitle(input.title);
  if (!title || !input.url) return null;
  if (input.year < period.yearFrom || input.year > period.yearTo) return null;

  const trustUrl = input.publisherUrl || input.url;
  const urlHostname = normalizeHostname(input.url);
  if (urlHostname === "news.google.com" && !input.publisherUrl) return null;
  if (!isTrustedNewsPublisher(trustUrl, title, input.description)) return null;
  if (!isPensionNewsCandidate(title, input.description)) return null;
  if (
    isExcludedRegionPaper({
      title,
      abstract: input.description,
      journal: input.sourceLabel,
    })
  ) {
    return null;
  }

  const { category, subCategory } = categorizeNewsArticle(
    title,
    input.description
  );

  const abstract =
    input.description.trim() ||
    `${title} — 글로벌 연기금·국민연금 관련 투자·운용 뉴스 기사입니다.`;

  return {
    id: `${input.idPrefix}-${hashUrl(input.url)}`,
    title,
    titleKo: title,
    authors: [input.sourceLabel],
    year: input.year,
    journal: input.sourceLabel,
    category,
    subCategory,
    abstract,
    abstractKo: abstract,
    summaryKo: "",
    originalUrl: input.url,
    hasAiSummary: false,
    countryCode:
      inferCountryFromText(`${title} ${abstract}`) ??
      (title.includes("국민연금") || abstract.includes("국민연금") ? "KR" : undefined),
    citationCount: 0,
    sourceSite: getSourceSiteLabel(trustUrl),
    publicationType: "news article",
    isNewsArticle: true,
    popularityScore: input.popularityScore,
    publishedAt: input.publishedAt,
  };
}

function formatGdeltDateTime(year: number, month: number, day: number): string {
  return `${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}000000`;
}

function looksLikeNewsUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (
      hostname.includes("doi.org") ||
      hostname.includes("springer") ||
      hostname.includes("wiley") ||
      hostname.includes("sciencedirect") ||
      hostname.includes("ssrn.com")
    ) {
      return false;
    }
    return (
      isTrustedNewsPublisher(url) ||
      isFinancialNewsDomain(url) ||
      isKoreanTrustedNewsDomain(url) ||
      hostname.includes("news")
    );
  } catch {
    return false;
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs?: number
): Promise<Response> {
  const isVercel = isServerlessEnv();
  const resolvedTimeout = timeoutMs ?? (isVercel ? 8000 : 15000);
  const maxAttempts = isVercel ? 1 : 2;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), resolvedTimeout);

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "PensionPapersDashboard/1.0",
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      return res;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt + 1 < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
      }
    }
  }

  throw lastError;
}

async function fetchGdeltTpaNews(period: FetchPeriod): Promise<Paper[]> {
  const start = formatGdeltDateTime(period.yearFrom, 1, 1);
  const end = formatGdeltDateTime(period.yearTo, 12, 31);
  const papers: Paper[] = [];
  const seenUrls = new Set<string>();

  for (const query of PENSION_NEWS_SEARCHES) {
    const params = new URLSearchParams({
      query,
      mode: "artlist",
      format: "json",
      maxrecords: "40",
      sort: "HybridRel",
      STARTDATETIME: start,
      ENDDATETIME: end,
    });

    try {
      const res = await fetchWithTimeout(
        `${GDELT_DOC_API}?${params.toString()}`
      );
      if (!res.ok) continue;

      const data = (await res.json()) as GdeltResponse;
      const articles = data.articles ?? [];

      articles.forEach((article, index) => {
        if (!article.url || !article.title || seenUrls.has(article.url)) return;
        seenUrls.add(article.url);

        const rankBoost = Math.max(1, 40 - index);
        const domainBoost = getDomainPopularity(article.domain);
        const popularityScore = rankBoost * 25 + domainBoost * 10;

        const paper = mapNewsToPaper(
          {
            title: article.title,
            url: article.url,
            year: parseGdeltYear(article.seendate),
            description: article.title,
            sourceLabel: getSourceSiteLabel(article.url),
            popularityScore,
            idPrefix: "news-gdelt",
            publishedAt: parseGdeltPublishedAt(article.seendate),
          },
          period
        );

        if (paper) papers.push(paper);
      });
    } catch (error) {
      console.warn("GDELT TPA news fetch failed:", error);
    }
  }

  return papers;
}

async function fetchNewsApiTpaNews(period: FetchPeriod): Promise<Paper[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return [];

  const papers: Paper[] = [];
  const seenUrls = new Set<string>();

  for (const query of PENSION_NEWS_SEARCHES) {
    const isKoreanQuery = /[\uAC00-\uD7A3]/.test(query);
    const params = new URLSearchParams({
      q: query,
      language: isKoreanQuery ? "ko" : "en",
      sortBy: "popularity",
      pageSize: "25",
      from: `${period.yearFrom}-01-01`,
      to: `${period.yearTo}-12-31`,
      apiKey,
    });

    try {
      const res = await fetch(`${NEWS_API_BASE}?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) continue;

      const data = (await res.json()) as NewsApiResponse;
      const articles = data.articles ?? [];

      articles.forEach((article, index) => {
        if (!article.url || !article.title || seenUrls.has(article.url)) return;
        seenUrls.add(article.url);

        const totalResults = data.totalResults ?? 100;
        const popularityScore = Math.round(
          ((totalResults - index) / Math.max(totalResults, 1)) * 1000 +
            getDomainPopularity(new URL(article.url).hostname) * 8
        );

        const paper = mapNewsToPaper(
          {
            title: article.title,
            url: article.url,
            year: parseIsoYear(article.publishedAt),
            description: article.description ?? article.title,
            sourceLabel: article.source?.name ?? getSourceSiteLabel(article.url),
            popularityScore,
            idPrefix: "news-api",
            publishedAt: toIsoDateString(article.publishedAt),
          },
          period
        );

        if (paper) papers.push(paper);
      });
    } catch (error) {
      console.warn("NewsAPI TPA news fetch failed:", error);
    }
  }

  return papers;
}

async function fetchOpenAlexTpaNews(period: FetchPeriod): Promise<Paper[]> {
  const mailto = process.env.OPENALEX_EMAIL ?? "pension-dashboard@example.com";
  const apiKey = process.env.OPENALEX_API_KEY;
  const papers: Paper[] = [];
  const seenUrls = new Set<string>();

  const filters = [
    `default.search:total portfolio approach pension,publication_year:${period.yearFrom}-${period.yearTo}`,
    `default.search:reference portfolio pension,publication_year:${period.yearFrom}-${period.yearTo}`,
    `default.search:reference portfolio asset owner,publication_year:${period.yearFrom}-${period.yearTo}`,
    `default.search:pension fund investment strategy,publication_year:${period.yearFrom}-${period.yearTo}`,
    `default.search:pension fund portfolio management,publication_year:${period.yearFrom}-${period.yearTo}`,
    `default.search:national pension fund investment,publication_year:${period.yearFrom}-${period.yearTo}`,
    `title.search:total portfolio approach,publication_year:${period.yearFrom}-${period.yearTo}`,
  ];

  for (const filter of filters) {
    const params = new URLSearchParams({
      filter,
      sort: "cited_by_count:desc",
      per_page: "25",
      mailto,
    });
    if (apiKey) params.set("api_key", apiKey);

    try {
      const res = await fetchWithTimeout(
        `https://api.openalex.org/works?${params.toString()}`
      );
      if (!res.ok) continue;

      const data = (await res.json()) as {
        results?: {
          id: string;
          title?: string;
          publication_year?: number | null;
          cited_by_count?: number;
          type?: string;
          primary_location?: {
            landing_page_url?: string;
            source?: { display_name?: string };
          };
        }[];
      };

      for (const [index, work] of (data.results ?? []).entries()) {
        const url = work.primary_location?.landing_page_url;
        const title = cleanTitle(work.title ?? "");
        if (!url || !title || seenUrls.has(url)) continue;
        if (!looksLikeNewsUrl(url)) continue;

        seenUrls.add(url);
        const popularityScore =
          (work.cited_by_count ?? 0) * 40 +
          getDomainPopularity(new URL(url).hostname) * 5 +
          Math.max(1, 25 - index);

        const paper = mapNewsToPaper(
          {
            title,
            url,
            year: work.publication_year ?? period.yearTo,
            description: title,
            sourceLabel:
              work.primary_location?.source?.display_name ??
              getSourceSiteLabel(url),
            popularityScore,
            idPrefix: "news-oa",
          },
          period
        );

        if (paper) papers.push(paper);
      }
    } catch (error) {
      console.warn("OpenAlex TPA news fetch failed:", error);
    }
  }

  return papers;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssYear(pubDate?: string): number {
  if (!pubDate) return new Date().getFullYear();
  const year = new Date(pubDate).getFullYear();
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

function parseGoogleNewsTitle(rawTitle: string): {
  title: string;
  sourceLabel?: string;
} {
  const title = decodeXml(rawTitle);
  const parts = title.split(" - ");
  if (parts.length >= 2) {
    return {
      title: parts.slice(0, -1).join(" - ").trim(),
      sourceLabel: parts[parts.length - 1]?.trim(),
    };
  }
  return { title };
}

async function fetchSingleGoogleNewsRssQuery(
  search: { query: string; hl: string; gl: string; ceid: string },
  period: FetchPeriod
): Promise<Paper[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${search.query}&hl=${search.hl}&gl=${search.gl}&ceid=${search.ceid}`;
  const papers: Paper[] = [];

  try {
    const res = await fetchWithTimeout(rssUrl, isServerlessEnv() ? 6000 : 12000);
    if (!res.ok) return papers;

    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

    items.forEach((match, index) => {
      const item = match[1] ?? "";
      const rawTitle = decodeXml(
        item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""
      );
      const parsedTitle = parseGoogleNewsTitle(rawTitle);
      const title = parsedTitle.title;
      const link = decodeXml(
        item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? ""
      );
      const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
      const source = decodeXml(
        item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? ""
      );
      const publisherUrl = decodeXml(
        item.match(/<source[^>]+url=["']([^"']+)["']/i)?.[1] ?? ""
      );

      if (!title || !link) return;

      const trustHostname = normalizeHostname(publisherUrl || link);
      const popularityBase = trustHostname
        ? getDomainPopularity(trustHostname)
        : 45;
      const popularityScore = 1200 - index * 15 + popularityBase * 6;

      const paper = mapNewsToPaper(
        {
          title,
          url: link,
          year: parseRssYear(pubDate),
          description: title,
          sourceLabel:
            parsedTitle.sourceLabel || source || getSourceSiteLabel(link),
            popularityScore,
            idPrefix: "news-rss",
            publisherUrl: publisherUrl || undefined,
            publishedAt: toIsoDateString(pubDate),
          },
        period
      );

      if (paper) papers.push(paper);
    });
  } catch (error) {
    console.warn("Google News RSS query failed:", search.query, error);
  }

  return papers;
}

async function fetchGoogleNewsRssTpa(period: FetchPeriod): Promise<Paper[]> {
  const searches: Array<{ query: string; hl: string; gl: string; ceid: string }> =
    [
      ...GLOBAL_GOOGLE_NEWS_RSS_SEARCHES,
      ...KOREA_GOOGLE_NEWS_RSS_SEARCHES,
      {
        query: "total+portfolio+approach+pension",
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      },
      {
        query: "total+portfolio+approach+institutional",
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      },
      {
        query: "reference+portfolio+pension+fund",
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      },
      {
        query: "pension+fund+portfolio+management",
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      },
      {
        query: "pension+fund+investment+strategy",
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      },
      {
        query: "reference+portfolio+asset+owner",
        hl: "en-US",
        gl: "US",
        ceid: "US:en",
      },
    ];

  const results = await Promise.allSettled(
    searches.map((search) => fetchSingleGoogleNewsRssQuery(search, period))
  );

  const seenUrls = new Set<string>();
  const papers: Paper[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const paper of result.value) {
      const urlKey = paper.originalUrl.toLowerCase();
      if (seenUrls.has(urlKey)) continue;
      seenUrls.add(urlKey);
      papers.push(paper);
    }
  }

  papers.sort(
    (a, b) =>
      (b.popularityScore ?? 0) - (a.popularityScore ?? 0) || b.year - a.year
  );

  return papers;
}

function getNewsRankScore(paper: Paper): number {
  let score = paper.popularityScore ?? 0;
  if (isFinancialNewsDomain(paper.originalUrl)) score += 300;
  if (isGlobalPensionNews(paper)) score += 220;
  if (hasGlobalPensionTrendSignal(`${paper.title} ${paper.abstract}`)) {
    score += 180;
  }
  if (
    paper.category === "asset-management" &&
    paper.subCategory === "alternative"
  ) {
    score += 120;
  }
  return score;
}

function mergeFetchedNews(sources: Paper[][]): Paper[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const merged: Paper[] = [];

  for (const paper of sources.flat()) {
    const urlKey = paper.originalUrl.toLowerCase();
    const titleKey = paper.title.toLowerCase();
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue;

    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    merged.push(paper);
  }

  const koreaDomestic = merged
    .filter(isKoreaDomesticNews)
    .sort((a, b) => getNewsRankScore(b) - getNewsRankScore(a));
  const globalNews = merged
    .filter((paper) => !isKoreaDomesticNews(paper))
    .sort((a, b) => getNewsRankScore(b) - getNewsRankScore(a));

  const koreaPick = koreaDomestic.slice(0, MAX_KOREA_DOMESTIC_NEWS);
  const globalSlots = Math.max(TPA_NEWS_MAX - koreaPick.length, TPA_NEWS_MAX - MAX_KOREA_DOMESTIC_NEWS);
  const globalPick = globalNews.slice(0, globalSlots);

  const combined = [...globalPick, ...koreaPick];
  if (combined.length < TPA_NEWS_MAX) {
    const pickedUrls = new Set(combined.map((paper) => paper.originalUrl.toLowerCase()));
    for (const paper of [...globalNews.slice(globalPick.length), ...koreaDomestic.slice(koreaPick.length)]) {
      if (combined.length >= TPA_NEWS_MAX) break;
      const urlKey = paper.originalUrl.toLowerCase();
      if (pickedUrls.has(urlKey)) continue;
      pickedUrls.add(urlKey);
      combined.push(paper);
    }
  }

  combined.sort(
    (a, b) =>
      getNewsRankScore(b) - getNewsRankScore(a) ||
      b.year - a.year
  );

  return combined.slice(0, TPA_NEWS_MAX);
}

export async function fetchTpaNewsArticles(
  period: FetchPeriod
): Promise<Paper[]> {
  const skipGdelt = isServerlessEnv();

  if (skipGdelt) {
    const [googleNews, newsApi] = await Promise.all([
      fetchGoogleNewsRssTpa(period),
      fetchNewsApiTpaNews(period),
    ]);
    return mergeFetchedNews([googleNews, newsApi]);
  }

  const [gdelt, newsApi, openAlexNews, googleNews] = await Promise.all([
    fetchGdeltTpaNews(period),
    fetchNewsApiTpaNews(period),
    fetchOpenAlexTpaNews(period),
    fetchGoogleNewsRssTpa(period),
  ]);

  return mergeFetchedNews([googleNews, newsApi, gdelt, openAlexNews]);
}

export function appendTpaNewsArticles(
  papers: Paper[],
  newsArticles: Paper[]
): Paper[] {
  if (newsArticles.length === 0) return papers;

  const seenUrls = new Set(
    papers.map((paper) => paper.originalUrl.toLowerCase())
  );
  const seenTitles = new Set(
    papers.map((paper) => paper.title.trim().toLowerCase())
  );
  const merged = [...papers];

  for (const article of newsArticles) {
    const urlKey = article.originalUrl.toLowerCase();
    const titleKey = article.title.trim().toLowerCase();
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) continue;

    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    merged.push(article);
  }

  merged.sort(
    (a, b) =>
      b.year - a.year ||
      (b.popularityScore ?? b.citationCount ?? 0) -
        (a.popularityScore ?? a.citationCount ?? 0)
  );

  return merged;
}

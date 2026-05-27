import { NextRequest, NextResponse } from "next/server";
import { fetchLatestPapers } from "@/lib/openalex";
import { getCachedPapers, setCachedPapers } from "@/lib/cache";
import { getCuratedPapers, mergeCuratedPapers } from "@/lib/curated-papers";
import { filterStoredAcademicPapers } from "@/lib/relevance";
import { hasLivePaperCorpus, isHealthyPaperCorpus } from "@/lib/cache-health";
import { applyCachedTitles } from "@/lib/title-translator";
import { enrichPapers } from "@/lib/source";
import { sleep } from "@/lib/fetch-utils";
import { getFetchBudgetMs } from "@/lib/server-env";
import {
  clampYearRange,
  DEFAULT_YEAR_FROM,
  getDefaultYearTo,
  parseYear,
} from "@/lib/period";
import { Paper } from "@/types/paper";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function parsePeriod(searchParams: URLSearchParams) {
  const yearFrom = parseYear(
    searchParams.get("yearFrom"),
    DEFAULT_YEAR_FROM
  );
  const yearTo = parseYear(searchParams.get("yearTo"), getDefaultYearTo());
  return clampYearRange(yearFrom, yearTo);
}

async function finalizePapers(
  papers: Paper[],
  period: ReturnType<typeof parsePeriod>
) {
  const enriched = enrichPapers(await applyCachedTitles(papers));
  return mergeCuratedPapers(filterStoredAcademicPapers(enriched), period);
}

async function fetchPapersWithinBudget(
  period: ReturnType<typeof parsePeriod>
): Promise<Paper[]> {
  let resolved: Paper[] | null = null;
  const fetchPromise = fetchLatestPapers(period).then((papers) => {
    resolved = papers;
    return papers;
  });

  const timedOut = await Promise.race([
    fetchPromise.then(() => false),
    sleep(getFetchBudgetMs()).then(() => true),
  ]);

  if (resolved) return resolved;
  if (!timedOut) return fetchPromise;

  const grace = await Promise.race([
    fetchPromise,
    sleep(20_000).then(() => null),
  ]);
  return grace ?? [];
}

function buildLiveSourceMeta(papers: Paper[]) {
  const hasOpenAlex = papers.some((p) => p.openAlexId?.startsWith("W"));
  const hasCrossRef = papers.some(
    (p) => p.openAlexId && !p.openAlexId.startsWith("W")
  );
  const source =
    hasOpenAlex && hasCrossRef
      ? "mixed"
      : hasOpenAlex
        ? "openalex"
        : "crossref";

  return { source, hasOpenAlex };
}

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";
  const period = parsePeriod(request.nextUrl.searchParams);

  try {
    if (!refresh) {
      const cached = await getCachedPapers(period.yearFrom, period.yearTo);
      if (cached) {
        const papers = await finalizePapers(cached.papers, period);
        return NextResponse.json({
          papers,
          meta: {
            source: "cache",
            count: papers.length,
            fetchedAt: cached.fetchedAt,
            yearFrom: period.yearFrom,
            yearTo: period.yearTo,
          },
        });
      }
    }

    const fetched = await fetchPapersWithinBudget(period);
    const papers = await finalizePapers(fetched, period);

    if (!hasLivePaperCorpus(papers)) {
      const fallback = getCuratedPapers(period);
      return NextResponse.json({
        papers: fallback,
        meta: {
          source: "fallback",
          count: fallback.length,
          fetchedAt: new Date().toISOString(),
          yearFrom: period.yearFrom,
          yearTo: period.yearTo,
          message:
            papers.length === 0
              ? "논문 API 수집 실패 — 샘플 데이터를 사용합니다. CrossRef/OpenAlex 연결을 확인해 주세요."
              : "논문·뉴스 수집 결과가 비정상적으로 적습니다. 잠시 후 ‘최신 논문 수집’을 다시 시도해 주세요.",
        },
      });
    }

    if (isHealthyPaperCorpus(papers)) {
      await setCachedPapers(papers, period.yearFrom, period.yearTo);
    }

    const { source, hasOpenAlex } = buildLiveSourceMeta(papers);

    return NextResponse.json({
      papers,
      meta: {
        source,
        count: papers.length,
        fetchedAt: new Date().toISOString(),
        openAlexEnabled: hasOpenAlex,
        yearFrom: period.yearFrom,
        yearTo: period.yearTo,
        ...(!isHealthyPaperCorpus(papers)
          ? {
              message:
                "일부 논문·뉴스만 수집되었습니다. ‘최신 논문 수집’을 다시 시도하면 더 많은 결과를 받을 수 있습니다.",
            }
          : {}),
      },
    });
  } catch (error) {
    console.error("Papers API error:", error);
    const fallback = getCuratedPapers(period);
    return NextResponse.json({
      papers: fallback,
      meta: {
        source: "fallback",
        count: fallback.length,
        fetchedAt: new Date().toISOString(),
        yearFrom: period.yearFrom,
        yearTo: period.yearTo,
        message: "오류 발생 — 샘플 데이터 사용",
      },
    });
  }
}

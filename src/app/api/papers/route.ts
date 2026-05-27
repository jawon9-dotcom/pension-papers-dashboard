import { NextRequest, NextResponse } from "next/server";
import { fetchLatestPapers } from "@/lib/openalex";
import { getCachedPapers, setCachedPapers } from "@/lib/cache";
import { getCuratedPapers, mergeCuratedPapers } from "@/lib/curated-papers";
import { isHealthyPaperCorpus } from "@/lib/cache-health";
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
  period: ReturnType<typeof parsePeriod>,
  options?: { fromCache?: boolean }
) {
  const enriched = enrichPapers(await applyCachedTitles(papers));
  return mergeCuratedPapers(enriched, period, {
    skipIngestFilter: options?.fromCache,
  });
}

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";
  const period = parsePeriod(request.nextUrl.searchParams);

  try {
    if (!refresh) {
      const cached = await getCachedPapers(period.yearFrom, period.yearTo);
      if (cached) {
        const papers = await finalizePapers(cached.papers, period, {
          fromCache: true,
        });
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

    const fetched = await Promise.race([
      fetchLatestPapers(period),
      sleep(getFetchBudgetMs()).then(() => null),
    ]);
    const papers = await finalizePapers(fetched ?? [], period);

    if (!isHealthyPaperCorpus(papers)) {
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
            "논문·뉴스 수집 결과가 비정상적으로 적습니다. 잠시 후 ‘최신 논문 수집’을 다시 시도해 주세요.",
        },
      });
    }

    if (papers.length === 0) {
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
            "논문 API 수집 실패 — 샘플 데이터를 사용합니다. CrossRef/OpenAlex 연결을 확인해 주세요.",
        },
      });
    }

    await setCachedPapers(papers, period.yearFrom, period.yearTo);

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

    return NextResponse.json({
      papers,
      meta: {
        source,
        count: papers.length,
        fetchedAt: new Date().toISOString(),
        openAlexEnabled: hasOpenAlex,
        yearFrom: period.yearFrom,
        yearTo: period.yearTo,
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

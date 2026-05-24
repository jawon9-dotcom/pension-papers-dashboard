import { NextRequest, NextResponse } from "next/server";
import { fetchLatestPapers } from "@/lib/openalex";
import { getCachedPapers, setCachedPapers } from "@/lib/cache";
import { papers as fallbackPapers } from "@/data/papers";
import { applyCachedTitles } from "@/lib/title-translator";
import { enrichPapers } from "@/lib/source";
import { sleep } from "@/lib/fetch-utils";
import { getFetchBudgetMs } from "@/lib/server-env";
import {
  clampYearRange,
  DEFAULT_YEAR_FROM,
  filterPapersByYear,
  getDefaultYearTo,
  parseYear,
} from "@/lib/period";

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

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";
  const period = parsePeriod(request.nextUrl.searchParams);

  try {
    if (!refresh) {
      const cached = await getCachedPapers(period.yearFrom, period.yearTo);
      if (cached) {
        return NextResponse.json({
          papers: enrichPapers(await applyCachedTitles(cached.papers)),
          meta: {
            source: "cache",
            count: cached.papers.length,
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
    const papers = enrichPapers(await applyCachedTitles(fetched ?? []));

    if (papers.length < 8) {
      const existingIds = new Set(papers.map((p) => p.id));
      for (const fp of filterPapersByYear(
        enrichPapers(fallbackPapers),
        period.yearFrom,
        period.yearTo
      )) {
        if (!existingIds.has(fp.id)) papers.push(fp);
      }
    }

    if (papers.length === 0) {
      return NextResponse.json({
        papers: filterPapersByYear(
          enrichPapers(fallbackPapers),
          period.yearFrom,
          period.yearTo
        ),
        meta: {
          source: "fallback",
          count: filterPapersByYear(fallbackPapers, period.yearFrom, period.yearTo)
            .length,
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
    return NextResponse.json({
      papers: filterPapersByYear(
        enrichPapers(fallbackPapers),
        period.yearFrom,
        period.yearTo
      ),
      meta: {
        source: "fallback",
        count: filterPapersByYear(fallbackPapers, period.yearFrom, period.yearTo)
          .length,
        fetchedAt: new Date().toISOString(),
        yearFrom: period.yearFrom,
        yearTo: period.yearTo,
        message: "오류 발생 — 샘플 데이터 사용",
      },
    });
  }
}

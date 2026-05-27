import { Dashboard } from "@/components/Dashboard";
import { getCachedPapers } from "@/lib/cache";
import { getCuratedPapers, mergeCuratedPapers } from "@/lib/curated-papers";
import { isHealthyPaperCorpus } from "@/lib/cache-health";
import { applyCachedTitles } from "@/lib/title-translator";
import { enrichPapers } from "@/lib/source";
import { DEFAULT_YEAR_FROM, getDefaultYearTo } from "@/lib/period";

export const dynamic = "force-dynamic";

export default async function Home() {
  const period = { yearFrom: DEFAULT_YEAR_FROM, yearTo: getDefaultYearTo() };
  const cached = await getCachedPapers(period.yearFrom, period.yearTo);

  if (cached && isHealthyPaperCorpus(cached.papers)) {
    const papers = mergeCuratedPapers(
      enrichPapers(await applyCachedTitles(cached.papers)),
      period,
      { skipIngestFilter: true }
    );

    return (
      <Dashboard
        initialPapers={papers}
        initialMeta={{
          source: "cache",
          count: papers.length,
          fetchedAt: cached.fetchedAt,
          yearFrom: period.yearFrom,
          yearTo: period.yearTo,
        }}
        autoFetchOnMount={false}
      />
    );
  }

  const fallback = getCuratedPapers(period);

  return (
    <Dashboard
      initialPapers={fallback}
      initialMeta={{
        source: "fallback",
        count: fallback.length,
        fetchedAt: new Date().toISOString(),
        yearFrom: period.yearFrom,
        yearTo: period.yearTo,
        message: "논문·뉴스 데이터를 불러오는 중입니다...",
      }}
      autoFetchOnMount
    />
  );
}

import { Dashboard } from "@/components/Dashboard";
import { getCachedPapers } from "@/lib/cache";
import { papers as fallbackPapers } from "@/data/papers";
import { enrichPapers } from "@/lib/source";
import { DEFAULT_YEAR_FROM, getDefaultYearTo } from "@/lib/period";

export const dynamic = "force-dynamic";

export default async function Home() {
  const period = { yearFrom: DEFAULT_YEAR_FROM, yearTo: getDefaultYearTo() };
  const cached = await getCachedPapers(period.yearFrom, period.yearTo);

  if (cached) {
    return (
      <Dashboard
        initialPapers={enrichPapers(cached.papers)}
        initialMeta={{
          source: "cache",
          count: cached.papers.length,
          fetchedAt: cached.fetchedAt,
          yearFrom: period.yearFrom,
          yearTo: period.yearTo,
        }}
        autoFetchOnMount={false}
      />
    );
  }

  return (
    <Dashboard
      initialPapers={enrichPapers(fallbackPapers)}
      initialMeta={{
        source: "fallback",
        count: fallbackPapers.length,
        fetchedAt: new Date().toISOString(),
        yearFrom: period.yearFrom,
        yearTo: period.yearTo,
        message: "논문·뉴스 데이터를 불러오는 중입니다...",
      }}
      autoFetchOnMount
    />
  );
}

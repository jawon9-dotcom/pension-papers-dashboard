import { Dashboard } from "@/components/Dashboard";
import { fetchLatestPapers } from "@/lib/openalex";
import { getCachedPapers, setCachedPapers } from "@/lib/cache";
import { papers as fallbackPapers } from "@/data/papers";
import { enrichPapers } from "@/lib/source";
import { DEFAULT_YEAR_FROM, getDefaultYearTo } from "@/lib/period";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function Home() {
  const period = { yearFrom: DEFAULT_YEAR_FROM, yearTo: getDefaultYearTo() };
  let initialPapers = enrichPapers(fallbackPapers);
  let initialMeta = {
    source: "fallback",
    count: fallbackPapers.length,
    fetchedAt: new Date().toISOString(),
    yearFrom: period.yearFrom,
    yearTo: period.yearTo,
  };

  const cached = await getCachedPapers(period.yearFrom, period.yearTo);
  if (cached) {
    initialPapers = enrichPapers(cached.papers);
    initialMeta = {
      source: "cache",
      count: cached.papers.length,
      fetchedAt: cached.fetchedAt,
      yearFrom: period.yearFrom,
      yearTo: period.yearTo,
    };
  } else {
    try {
      const papers = await fetchLatestPapers(period);
      if (papers.length > 0) {
        initialPapers = papers;
        initialMeta = {
          source: papers.some((p) => p.openAlexId?.startsWith("W"))
            ? "openalex"
            : "crossref",
          count: papers.length,
          fetchedAt: new Date().toISOString(),
          yearFrom: period.yearFrom,
          yearTo: period.yearTo,
        };
        await setCachedPapers(papers, period.yearFrom, period.yearTo);
      }
    } catch (error) {
      console.error("Initial paper fetch failed:", error);
    }
  }

  return (
    <Dashboard initialPapers={initialPapers} initialMeta={initialMeta} />
  );
}

import { NextRequest, NextResponse } from "next/server";
import { fetchCitationGraph } from "@/lib/citation-graph";
import { readCache, writeCache } from "@/lib/cache";

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

interface ConnectedCacheEntry {
  fetchedAt: string;
  graph: Awaited<ReturnType<typeof fetchCitationGraph>>;
}

export async function GET(request: NextRequest) {
  const paperId = request.nextUrl.searchParams.get("paperId");
  const openAlexId = request.nextUrl.searchParams.get("openAlexId");
  const originalUrl = request.nextUrl.searchParams.get("originalUrl");
  const title = request.nextUrl.searchParams.get("title");

  if (!paperId && !openAlexId) {
    return NextResponse.json(
      { error: "paperId 또는 openAlexId가 필요합니다." },
      { status: 400 }
    );
  }

  const cacheKey = `connected/${openAlexId ?? paperId}.json`;
  const cached = await readCache<ConnectedCacheEntry>(cacheKey);
  if (cached?.graph) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return NextResponse.json({ graph: cached.graph, cached: true });
    }
  }

  const graph = await fetchCitationGraph({
    id: paperId ?? openAlexId ?? "",
    openAlexId: openAlexId ?? undefined,
    originalUrl: originalUrl ?? undefined,
    title: title ?? undefined,
  });

  if (!graph) {
    return NextResponse.json(
      {
        error:
          "Connected Papers 그래프를 생성할 수 없습니다. OpenAlex ID 또는 DOI가 필요합니다.",
      },
      { status: 404 }
    );
  }

  await writeCache(cacheKey, {
    fetchedAt: new Date().toISOString(),
    graph,
  } satisfies ConnectedCacheEntry);

  return NextResponse.json({ graph, cached: false });
}

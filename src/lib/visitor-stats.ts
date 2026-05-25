import { readCache, writeCache } from "./cache";
import {
  getPersistentVisitorCount,
  isPersistentVisitorStoreAvailable,
  trackPersistentVisitor,
} from "./visitor-store";

const VISITOR_STATS_FILE = "visitor-stats-v1.json";
const MAX_VISITOR_IDS = 500_000;

export interface VisitorStats {
  visitorIds: string[];
  uniqueCount: number;
  updatedAt: string;
}

function emptyStats(): VisitorStats {
  return {
    visitorIds: [],
    uniqueCount: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function isValidVisitorId(visitorId: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    visitorId
  );
}

async function getFileVisitorStats(): Promise<VisitorStats> {
  const cached = await readCache<VisitorStats>(VISITOR_STATS_FILE);
  if (!cached || !Array.isArray(cached.visitorIds)) {
    return emptyStats();
  }

  return {
    visitorIds: cached.visitorIds,
    uniqueCount: cached.uniqueCount ?? cached.visitorIds.length,
    updatedAt: cached.updatedAt ?? new Date().toISOString(),
  };
}

async function trackFileVisitor(
  visitorId: string
): Promise<{ uniqueCount: number; isNew: boolean }> {
  const stats = await getFileVisitorStats();
  const known = new Set(stats.visitorIds);

  if (known.has(visitorId)) {
    return { uniqueCount: stats.uniqueCount, isNew: false };
  }

  const visitorIds = [...stats.visitorIds, visitorId];
  const trimmedIds =
    visitorIds.length > MAX_VISITOR_IDS
      ? visitorIds.slice(visitorIds.length - MAX_VISITOR_IDS)
      : visitorIds;

  const next: VisitorStats = {
    visitorIds: trimmedIds,
    uniqueCount: trimmedIds.length,
    updatedAt: new Date().toISOString(),
  };

  await writeCache(VISITOR_STATS_FILE, next);

  return { uniqueCount: next.uniqueCount, isNew: true };
}

export async function getVisitorStats(): Promise<VisitorStats> {
  if (isPersistentVisitorStoreAvailable()) {
    const uniqueCount = (await getPersistentVisitorCount()) ?? 0;
    return {
      visitorIds: [],
      uniqueCount,
      updatedAt: new Date().toISOString(),
    };
  }

  if (process.env.VERCEL) {
    console.warn(
      "Visitor stats: KV/Upstash env vars missing on Vercel. Counts reset per server instance."
    );
  }

  return getFileVisitorStats();
}

export async function trackVisitor(
  visitorId: string
): Promise<{ uniqueCount: number; isNew: boolean }> {
  if (!isValidVisitorId(visitorId)) {
    const stats = await getVisitorStats();
    return { uniqueCount: stats.uniqueCount, isNew: false };
  }

  if (isPersistentVisitorStoreAvailable()) {
    const tracked = await trackPersistentVisitor(visitorId);
    if (tracked) {
      return tracked;
    }

    console.warn(
      "Visitor stats: Redis tracking failed, falling back to file cache."
    );
  }

  return trackFileVisitor(visitorId);
}

import fs from "fs/promises";
import path from "path";

const memoryCache = new Map<string, unknown>();

function getCacheDir(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "pension-papers-cache");
  }
  return path.join(process.cwd(), ".cache");
}

export async function readCache<T>(filename: string): Promise<T | null> {
  if (memoryCache.has(filename)) {
    return memoryCache.get(filename) as T;
  }

  try {
    const raw = await fs.readFile(
      path.join(getCacheDir(), filename),
      "utf-8"
    );
    const data = JSON.parse(raw) as T;
    memoryCache.set(filename, data);
    return data;
  } catch {
    return null;
  }
}

export async function writeCache(
  filename: string,
  data: unknown
): Promise<void> {
  memoryCache.set(filename, data);

  try {
    const dir = getCacheDir();
    const filePath = path.join(dir, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.warn("Cache write skipped (read-only filesystem):", error);
  }
}

export async function readSummaryCache(
  paperId: string
): Promise<{ titleKo: string; abstractKo: string; summaryKo: string } | null> {
  return readCache(`summaries/${paperId}.json`);
}

export async function writeSummaryCache(
  paperId: string,
  data: { titleKo: string; abstractKo: string; summaryKo: string }
): Promise<void> {
  await writeCache(`summaries/${paperId}.json`, data);
}

export interface PapersCacheEntry {
  fetchedAt: string;
  papers: import("@/types/paper").Paper[];
  yearFrom?: number;
  yearTo?: number;
}

const PAPERS_TTL_MS = 24 * 60 * 60 * 1000;

function papersCacheKey(yearFrom?: number, yearTo?: number): string {
  if (yearFrom !== undefined && yearTo !== undefined) {
    return `papers-v21-${yearFrom}-${yearTo}.json`;
  }
  return "papers-v21.json";
}

export async function getCachedPapers(
  yearFrom?: number,
  yearTo?: number
): Promise<PapersCacheEntry | null> {
  const cached = await readCache<PapersCacheEntry>(
    papersCacheKey(yearFrom, yearTo)
  );
  if (!cached) return null;

  if (
    yearFrom !== undefined &&
    yearTo !== undefined &&
    (cached.yearFrom !== yearFrom || cached.yearTo !== yearTo)
  ) {
    return null;
  }

  const age = Date.now() - new Date(cached.fetchedAt).getTime();
  if (age > PAPERS_TTL_MS) return null;

  return cached;
}

export async function setCachedPapers(
  papers: import("@/types/paper").Paper[],
  yearFrom?: number,
  yearTo?: number
): Promise<void> {
  await writeCache(papersCacheKey(yearFrom, yearTo), {
    fetchedAt: new Date().toISOString(),
    papers,
    yearFrom,
    yearTo,
  } satisfies PapersCacheEntry);
}

export async function getPaperFromCache(
  paperId: string
): Promise<import("@/types/paper").Paper | null> {
  for (const [filename, value] of memoryCache.entries()) {
    if (!filename.startsWith("papers")) continue;
    const entry = value as PapersCacheEntry;
    const found = entry.papers?.find((p) => p.id === paperId);
    if (found) return found;
  }

  const cached = await readCache<PapersCacheEntry>("papers.json");
  if (cached) {
    return cached.papers.find((p) => p.id === paperId) ?? null;
  }

  return null;
}

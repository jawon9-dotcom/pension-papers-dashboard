export function isServerlessEnv(): boolean {
  return Boolean(process.env.VERCEL);
}

/** Vercel maxDuration(120s)에 맞춘 fetch 예산 */
export function getFetchBudgetMs(): number {
  return isServerlessEnv() ? 95_000 : 110_000;
}

export function getNewsFetchTimeoutMs(): number {
  return isServerlessEnv() ? 12000 : 30000;
}

export function getFetchDelayMs(): number {
  return isServerlessEnv() ? 0 : 120;
}

export function getCrossRefFetchDelayMs(): number {
  return isServerlessEnv() ? 0 : 150;
}

export function getServerlessQueriesPerYear(defaultCount: number): number {
  if (!isServerlessEnv()) return defaultCount;
  return Math.min(defaultCount, 10);
}

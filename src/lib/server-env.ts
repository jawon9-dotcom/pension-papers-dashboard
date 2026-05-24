export function isServerlessEnv(): boolean {
  return Boolean(process.env.VERCEL);
}

/** Vercel Hobby 함수 제한(10s)을 고려한 fetch 예산 — maxDuration 120s 활용 */
export function getFetchBudgetMs(): number {
  return isServerlessEnv() ? 55000 : 110000;
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
  return Math.min(defaultCount, 4);
}

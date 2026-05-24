export function isServerlessEnv(): boolean {
  return Boolean(process.env.VERCEL);
}

/** Vercel Hobby 함수 제한(10s)을 고려한 fetch 예산 */
export function getFetchBudgetMs(): number {
  return isServerlessEnv() ? 8000 : 110000;
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

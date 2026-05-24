export const DEFAULT_YEAR_FROM = 2022;
export const PAPERS_PER_YEAR = 50;
export const MAX_PAPERS_CAP = 500;
export const TPA_NEWS_MAX = 65;

export function getDefaultYearTo(): number {
  return new Date().getFullYear();
}

export function listYearsInRange(from: number, to: number): number[] {
  const years: number[] = [];
  for (let year = from; year <= to; year++) {
    years.push(year);
  }
  return years;
}

export function getYearSpan(from: number, to: number): number {
  return to - from + 1;
}

/** 연도당 최대 50건, 전체 상한 500건 */
export function getMaxPapersForPeriod(from: number, to: number): number {
  const span = getYearSpan(from, to);
  return Math.min(MAX_PAPERS_CAP, span * PAPERS_PER_YEAR);
}

export function buildYearFetchPlan(
  yearFrom: number,
  yearTo: number,
  queryCount: number
): {
  years: number[];
  maxTotal: number;
  queriesPerYear: number;
  perPage: number;
} {
  const years = listYearsInRange(yearFrom, yearTo);
  const maxTotal = getMaxPapersForPeriod(yearFrom, yearTo);
  const defaultQueriesPerYear = Math.min(queryCount, years.length <= 3 ? 10 : 8);
  const queriesPerYear =
    typeof process !== "undefined" && process.env.VERCEL
      ? Math.min(defaultQueriesPerYear, 4)
      : defaultQueriesPerYear;
  const targetPerYear = Math.ceil(maxTotal / years.length);
  const perPage = Math.max(
    8,
    Math.min(20, Math.ceil(targetPerYear / queriesPerYear))
  );

  return { years, maxTotal, queriesPerYear, perPage };
}

export function pickRotatedQueries<T>(
  queries: readonly T[],
  offset: number,
  count: number
): T[] {
  if (queries.length === 0 || count <= 0) return [];

  const picked: T[] = [];
  for (let i = 0; i < count; i++) {
    picked.push(queries[(offset + i) % queries.length]);
  }
  return picked;
}

export function parseYear(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

export function buildYearFilter(from: number, to: number): string {
  return listYearsInRange(from, to).join("|");
}

export function clampYearRange(
  from: number,
  to: number
): { yearFrom: number; yearTo: number } {
  const minYear = 2000;
  const maxYear = getDefaultYearTo() + 1;
  let yearFrom = parseYear(from, DEFAULT_YEAR_FROM);
  let yearTo = parseYear(to, getDefaultYearTo());
  yearFrom = Math.min(Math.max(yearFrom, minYear), maxYear);
  yearTo = Math.min(Math.max(yearTo, minYear), maxYear);
  if (yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom];
  return { yearFrom, yearTo };
}

export function filterPapersByYear<T extends { year: number }>(
  papers: T[],
  yearFrom: number,
  yearTo: number
): T[] {
  return papers.filter((p) => p.year >= yearFrom && p.year <= yearTo);
}

export interface FetchPeriod {
  yearFrom: number;
  yearTo: number;
}

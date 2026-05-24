export const PRIORITY_REGION_CODES = new Set(["US", "CA", "AU", "NZ", "JP", "KR"]);

export const PRIORITY_REGION_TERMS = [
  "calpers",
  "calstrs",
  "nystrs",
  "texas teachers",
  "cppib",
  "ontario teachers",
  "otpp",
  "cdpq",
  "australiansuper",
  "australian super",
  "australian retirement trust",
  "future fund australia",
  "nz super",
  "new zealand super",
  "guardians of new zealand",
  "gpif",
  "government pension investment fund",
  "japan pension",
  "japanese pension",
  "national pension service",
  "nps korea",
  "nps fund",
  "korea national pension",
  "국민연금",
  "united states pension",
  "u.s. pension",
  "us public pension",
  "canadian pension",
  "australian pension",
  "australian superannuation",
];

export const PRIORITY_REGION_OPENALEX_QUERIES = [
  { filter: "title.search:calpers pension asset allocation", mode: "priority" as const },
  { filter: "title.search:calstrs pension investment", mode: "priority" as const },
  { filter: "title.search:cppib pension portfolio", mode: "priority" as const },
  { filter: "title.search:ontario teachers pension investment", mode: "priority" as const },
  { filter: "title.search:australian super fund pension", mode: "priority" as const },
  { filter: "title.search:australia superannuation pension fund", mode: "priority" as const },
  { filter: "title.search:new zealand super fund pension", mode: "priority" as const },
  { filter: "title.search:gpif pension asset allocation", mode: "priority" as const },
  { filter: "title.search:japan pension investment fund", mode: "priority" as const },
  { filter: "default.search:united states public pension fund asset allocation", mode: "priority" as const },
  { filter: "default.search:canadian pension fund investment strategy", mode: "priority" as const },
  { filter: "default.search:australian pension fund portfolio management", mode: "priority" as const },
];

export const PRIORITY_REGION_CROSSREF_QUERIES = [
  { query: "calpers pension asset allocation", mode: "priority" as const },
  { query: "calstrs pension investment strategy", mode: "priority" as const },
  { query: "cppib pension portfolio management", mode: "priority" as const },
  { query: "ontario teachers pension plan investment", mode: "priority" as const },
  { query: "australian superannuation pension fund asset allocation", mode: "priority" as const },
  { query: "australia super fund pension investment", mode: "priority" as const },
  { query: "new zealand super fund pension investment", mode: "priority" as const },
  { query: "gpif pension asset allocation", mode: "priority" as const },
  { query: "japan government pension investment fund", mode: "priority" as const },
  { query: "united states public pension fund portfolio", mode: "priority" as const },
  { query: "canadian public pension fund investment", mode: "priority" as const },
];

export const PRIORITY_REGION_NEWS_SEARCHES = [
  "calpers investment strategy",
  "calstrs asset allocation",
  "cppib portfolio strategy",
  "ontario teachers pension investment",
  "australian super fund pension",
  "australia superannuation investment",
  "new zealand super fund investment",
  "gpif asset allocation",
  "japan pension investment fund",
  "us public pension fund portfolio",
  "canadian pension fund investment",
];

export function hasPriorityRegionSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  return PRIORITY_REGION_TERMS.some((term) => normalized.includes(term));
}

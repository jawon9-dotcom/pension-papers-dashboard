import {
  CitationGraph,
  CitationGraphEdge,
  CitationGraphNode,
} from "@/types/citation-graph";

const OPENALEX_BASE = "https://api.openalex.org/works";
const API_KEY = process.env.OPENALEX_API_KEY;
const MAILTO = process.env.OPENALEX_EMAIL ?? "pension-dashboard@example.com";

const MAX_RELATED = 12;
const MAX_CITED_BY = 6;
const MAX_REFERENCES = 6;

interface OpenAlexWork {
  id: string;
  title: string;
  publication_year: number | null;
  doi: string | null;
  authorships: { author: { display_name: string } }[];
  primary_location?: {
    landing_page_url?: string;
    source?: { display_name: string };
  } | null;
  open_access?: { oa_url?: string };
  cited_by_count?: number;
  related_works?: string[];
  referenced_works?: string[];
}

interface OpenAlexListResponse {
  results: OpenAlexWork[];
}

function openAlexParams(): URLSearchParams {
  const params = new URLSearchParams({ mailto: MAILTO });
  if (API_KEY) params.set("api_key", API_KEY);
  return params;
}

function stripOpenAlexId(urlOrId: string): string {
  return urlOrId.replace("https://openalex.org/", "").trim();
}

function isOpenAlexWorkId(id: string): boolean {
  return /^W\d+$/i.test(id);
}

export function resolveOpenAlexWorkKey(paper: {
  id: string;
  openAlexId?: string;
  originalUrl?: string;
}): string | null {
  const candidates = [paper.openAlexId, paper.id].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const normalized = stripOpenAlexId(candidate);
    if (isOpenAlexWorkId(normalized)) return normalized;
  }

  const doiMatch = paper.originalUrl?.match(/doi\.org\/(10\.[^\s?#]+)/i);
  if (doiMatch) return `https://doi.org/${doiMatch[1]}`;

  return null;
}

function mapWorkToNode(
  work: OpenAlexWork,
  relation: CitationGraphNode["relation"],
  isSeed = false
): CitationGraphNode {
  const id = stripOpenAlexId(work.id);
  const title = work.title?.replace(/\s+/g, " ").trim() || "Untitled";
  const originalUrl =
    work.primary_location?.landing_page_url ??
    work.doi ??
    work.open_access?.oa_url ??
    `https://openalex.org/${id}`;

  return {
    id,
    title,
    year: work.publication_year ?? new Date().getFullYear(),
    citationCount: work.cited_by_count ?? 0,
    authors:
      work.authorships
        ?.map((a) => a.author?.display_name)
        .filter(Boolean)
        .slice(0, 3) ?? [],
    originalUrl,
    isSeed,
    relation,
  };
}

async function fetchOpenAlexJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchWork(workKey: string): Promise<OpenAlexWork | null> {
  const params = openAlexParams();
  const path = workKey.startsWith("http")
    ? encodeURIComponent(workKey)
    : workKey;
  return fetchOpenAlexJson<OpenAlexWork>(`${OPENALEX_BASE}/${path}?${params}`);
}

async function fetchWorksByIds(ids: string[]): Promise<OpenAlexWork[]> {
  if (ids.length === 0) return [];

  const params = openAlexParams();
  params.set("filter", `openalex:${ids.join("|")}`);
  params.set("per_page", String(Math.min(ids.length, 25)));

  const data = await fetchOpenAlexJson<OpenAlexListResponse>(
    `${OPENALEX_BASE}?${params}`
  );
  return data?.results ?? [];
}

async function fetchCitedBy(seedId: string, limit: number): Promise<OpenAlexWork[]> {
  const params = openAlexParams();
  params.set("filter", `cites:${seedId}`);
  params.set("sort", "cited_by_count:desc");
  params.set("per_page", String(limit));

  const data = await fetchOpenAlexJson<OpenAlexListResponse>(
    `${OPENALEX_BASE}?${params}`
  );
  return data?.results ?? [];
}

function addEdge(
  edges: CitationGraphEdge[],
  source: string,
  target: string,
  type: CitationGraphEdge["type"]
) {
  if (source === target) return;
  const key = `${source}-${target}-${type}`;
  if (edges.some((e) => `${e.source}-${e.target}-${e.type}` === key)) return;
  edges.push({ source, target, type });
}

export async function fetchCitationGraph(paper: {
  id: string;
  openAlexId?: string;
  originalUrl?: string;
  title?: string;
}): Promise<CitationGraph | null> {
  const workKey = resolveOpenAlexWorkKey(paper);
  if (!workKey) return null;

  const seedWork = await fetchWork(workKey);
  if (!seedWork) return null;

  const seedId = stripOpenAlexId(seedWork.id);
  const seedNode = mapWorkToNode(seedWork, "seed", true);

  const relatedIds = (seedWork.related_works ?? [])
    .map(stripOpenAlexId)
    .filter((id) => id !== seedId)
    .slice(0, MAX_RELATED);

  const referenceIds = (seedWork.referenced_works ?? [])
    .map(stripOpenAlexId)
    .filter((id) => id !== seedId)
    .slice(0, MAX_REFERENCES);

  const [relatedWorks, referenceWorks, citedByWorks] = await Promise.all([
    fetchWorksByIds(relatedIds),
    fetchWorksByIds(referenceIds),
    fetchCitedBy(seedId, MAX_CITED_BY),
  ]);

  const nodes: CitationGraphNode[] = [seedNode];
  const edges: CitationGraphEdge[] = [];
  const seen = new Set<string>([seedId]);

  for (const work of relatedWorks) {
    const id = stripOpenAlexId(work.id);
    if (seen.has(id)) continue;
    seen.add(id);
    nodes.push(mapWorkToNode(work, "related"));
    addEdge(edges, seedId, id, "similarity");
  }

  for (const work of citedByWorks) {
    const id = stripOpenAlexId(work.id);
    if (seen.has(id)) continue;
    seen.add(id);
    nodes.push(mapWorkToNode(work, "cited_by"));
    addEdge(edges, id, seedId, "cited_by");
  }

  for (const work of referenceWorks) {
    const id = stripOpenAlexId(work.id);
    if (seen.has(id)) continue;
    seen.add(id);
    nodes.push(mapWorkToNode(work, "references"));
    addEdge(edges, seedId, id, "cites");
  }

  return {
    seedId,
    seedTitle: seedNode.title,
    nodes,
    edges,
    stats: {
      related: relatedWorks.length,
      citedBy: citedByWorks.length,
      references: referenceWorks.length,
    },
  };
}

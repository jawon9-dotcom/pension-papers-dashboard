export type CitationRelation = "seed" | "related" | "cited_by" | "references";

export interface CitationGraphNode {
  id: string;
  title: string;
  year: number;
  citationCount: number;
  authors: string[];
  originalUrl: string;
  isSeed: boolean;
  relation: CitationRelation;
}

export interface CitationGraphEdge {
  source: string;
  target: string;
  type: "similarity" | "cites" | "cited_by";
}

export interface CitationGraph {
  seedId: string;
  seedTitle: string;
  nodes: CitationGraphNode[];
  edges: CitationGraphEdge[];
  stats: {
    related: number;
    citedBy: number;
    references: number;
  };
}

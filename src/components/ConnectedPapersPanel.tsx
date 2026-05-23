"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CitationGraph,
  CitationGraphNode,
  CitationRelation,
} from "@/types/citation-graph";
import { Paper } from "@/types/paper";

interface ConnectedPapersPanelProps {
  paper: Paper;
  onSelectNode?: (node: CitationGraphNode) => void;
}

type GraphTab = "graph" | "related" | "cited_by" | "references";

const RELATION_LABELS: Record<CitationRelation, string> = {
  seed: "기준 논문",
  related: "유사 논문",
  cited_by: "인용 논문",
  references: "참고문헌",
};

const RELATION_COLORS: Record<CitationRelation, string> = {
  seed: "#3b82f6",
  related: "#34d399",
  cited_by: "#fbbf24",
  references: "#a78bfa",
};

function nodeRadius(citationCount: number, isSeed: boolean): number {
  if (isSeed) return 22;
  return Math.min(18, Math.max(10, 8 + Math.sqrt(citationCount + 1) * 1.2));
}

function layoutNodes(nodes: CitationGraphNode[]) {
  const seed = nodes.find((n) => n.isSeed);
  if (!seed) return [];

  const center = { x: 200, y: 170 };
  const related = nodes.filter((n) => n.relation === "related");
  const citedBy = nodes.filter((n) => n.relation === "cited_by");
  const references = nodes.filter((n) => n.relation === "references");

  const placed: {
    node: CitationGraphNode;
    x: number;
    y: number;
    r: number;
  }[] = [
    {
      node: seed,
      x: center.x,
      y: center.y,
      r: nodeRadius(seed.citationCount, true),
    },
  ];

  const placeRing = (
    ringNodes: CitationGraphNode[],
    radius: number,
    startAngle = -Math.PI / 2
  ) => {
    ringNodes.forEach((node, index) => {
      const angle =
        startAngle + (index / Math.max(ringNodes.length, 1)) * Math.PI * 2;
      placed.push({
        node,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
        r: nodeRadius(node.citationCount, false),
      });
    });
  };

  placeRing(related, 118);
  placeRing(citedBy, 155, -Math.PI / 2 + 0.4);
  placeRing(references, 155, Math.PI / 2 + 0.4);

  return placed;
}

function truncateTitle(title: string, max = 48): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max)}…`;
}

export function ConnectedPapersPanel({
  paper,
  onSelectNode,
}: ConnectedPapersPanelProps) {
  const [graph, setGraph] = useState<CitationGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<GraphTab>("graph");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      paperId: paper.id,
      title: paper.title,
    });
    if (paper.openAlexId) params.set("openAlexId", paper.openAlexId);
    if (paper.originalUrl) params.set("originalUrl", paper.originalUrl);

    try {
      const res = await fetch(`/api/papers/connected?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "그래프를 불러오지 못했습니다.");
      setGraph(data.graph);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setGraph(null);
    } finally {
      setLoading(false);
    }
  }, [paper]);

  useEffect(() => {
    setGraph(null);
    setError(null);
    setExpanded(false);
    setActiveTab("graph");
  }, [paper.id]);

  useEffect(() => {
    if (expanded && !graph && !loading) {
      loadGraph();
    }
  }, [expanded, graph, loading, loadGraph]);

  const placedNodes = useMemo(
    () => (graph ? layoutNodes(graph.nodes) : []),
    [graph]
  );

  const hoveredNode = placedNodes.find((p) => p.node.id === hoveredId)?.node;

  const listNodes = useMemo(() => {
    if (!graph) return [];
    if (activeTab === "related")
      return graph.nodes.filter((n) => n.relation === "related");
    if (activeTab === "cited_by")
      return graph.nodes.filter((n) => n.relation === "cited_by");
    if (activeTab === "references")
      return graph.nodes.filter((n) => n.relation === "references");
    return graph.nodes.filter((n) => !n.isSeed);
  }, [graph, activeTab]);

  const handleNodeAction = (node: CitationGraphNode) => {
    if (onSelectNode) {
      onSelectNode(node);
      return;
    }
    window.open(node.originalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="border-b border-slate-800 px-4 py-4 sm:px-6 sm:py-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-violet-300">
            Connected Papers
            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-normal text-violet-200">
              인용 네트워크
            </span>
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            OpenAlex 기반 유사·인용·참고문헌 관계를 시각화합니다.{" "}
            <a
              href="https://github.com/FZJ-IEK3-VSA/citation-graph-builder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              Citation Graph Builder
            </a>
            와 같은 인용 네트워크 개념을 참고했습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-h-9 shrink-0 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20"
        >
          {expanded ? "접기" : "그래프 보기"}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {loading && (
            <div className="flex items-center gap-3 py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500" />
              <p className="text-sm text-slate-500">
                인용 네트워크를 구성하는 중...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {graph && !loading && (
            <>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span>유사 {graph.stats.related}건</span>
                <span>·</span>
                <span>인용 {graph.stats.citedBy}건</span>
                <span>·</span>
                <span>참고문헌 {graph.stats.references}건</span>
              </div>

              <div className="flex flex-wrap gap-1 rounded-lg border border-slate-700 bg-slate-800/40 p-1">
                {(
                  [
                    ["graph", "그래프"],
                    ["related", "유사"],
                    ["cited_by", "인용"],
                    ["references", "참고"],
                  ] as const
                ).map(([tab, label]) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`min-h-8 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                      activeTab === tab
                        ? "bg-violet-600 text-white"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "graph" && (
                <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80 p-2">
                  <svg
                    viewBox="0 0 400 340"
                    className="mx-auto w-full min-w-[320px] max-w-lg"
                    role="img"
                    aria-label="Connected Papers citation graph"
                  >
                    {graph.edges.map((edge) => {
                      const from = placedNodes.find(
                        (p) => p.node.id === edge.source
                      );
                      const to = placedNodes.find(
                        (p) => p.node.id === edge.target
                      );
                      if (!from || !to) return null;
                      return (
                        <line
                          key={`${edge.source}-${edge.target}-${edge.type}`}
                          x1={from.x}
                          y1={from.y}
                          x2={to.x}
                          y2={to.y}
                          stroke={
                            edge.type === "similarity"
                              ? "#34d39955"
                              : edge.type === "cited_by"
                                ? "#fbbf2455"
                                : "#a78bfa55"
                          }
                          strokeWidth={1.5}
                        />
                      );
                    })}

                    {placedNodes.map(({ node, x, y, r }) => (
                      <g
                        key={node.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredId(node.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleNodeAction(node)}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={r}
                          fill={RELATION_COLORS[node.relation]}
                          fillOpacity={node.isSeed ? 0.95 : 0.75}
                          stroke={
                            hoveredId === node.id ? "#f8fafc" : "#0f172a"
                          }
                          strokeWidth={hoveredId === node.id ? 2 : 1}
                        />
                        {!node.isSeed && r >= 12 && (
                          <text
                            x={x}
                            y={y + 1}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#0f172a"
                            fontSize="9"
                            fontWeight="700"
                            pointerEvents="none"
                          >
                            {node.year}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>

                  <div className="mt-2 flex flex-wrap justify-center gap-3 px-2 pb-1 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      기준
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      유사
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      인용
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-violet-400" />
                      참고
                    </span>
                  </div>

                  {hoveredNode && (
                    <div className="mx-auto mt-2 max-w-lg rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2">
                      <p className="text-xs font-medium text-slate-200">
                        {truncateTitle(hoveredNode.title, 80)}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {RELATION_LABELS[hoveredNode.relation]} ·{" "}
                        {hoveredNode.year} · 인용 {hoveredNode.citationCount}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab !== "graph" && (
                <ul className="scroll-area max-h-64 space-y-2 overflow-y-auto pr-1">
                  {listNodes.length === 0 ? (
                    <li className="py-4 text-center text-xs text-slate-500">
                      표시할 논문이 없습니다.
                    </li>
                  ) : (
                    listNodes.map((node) => (
                      <li key={node.id}>
                        <button
                          type="button"
                          onClick={() => handleNodeAction(node)}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-left transition hover:border-slate-600 hover:bg-slate-800/70"
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-slate-900"
                              style={{
                                backgroundColor: RELATION_COLORS[node.relation],
                              }}
                            >
                              {RELATION_LABELS[node.relation]}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {node.year} · 인용 {node.citationCount}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-snug text-slate-100">
                            {truncateTitle(node.title, 100)}
                          </p>
                          {node.authors.length > 0 && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {node.authors.join(", ")}
                            </p>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

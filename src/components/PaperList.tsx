"use client";

import { useEffect, useState } from "react";
import {
  Paper,
  MainCategory,
  SubCategory,
  CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  CATEGORY_COLORS,
  getPublicationSourceLabel,
} from "@/types/paper";
import { AbstractPopup } from "./AbstractPopup";
import { CountryFlag } from "./CountryFlag";
import { PaperMetaBadges } from "./PaperMetaBadges";
import { ContentType } from "./ContentTypeFilter";

interface PaperListProps {
  papers: Paper[];
  selectedId: string | null;
  onSelect: (paper: Paper) => void;
  activeCategory: MainCategory | "all";
  activeSubCategory: SubCategory | "all";
  contentType?: ContentType;
}

const colorMap: Record<string, { badge: string; dot: string; selected: string }> = {
  emerald: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot: "bg-emerald-400",
    selected: "border-emerald-500/60 bg-emerald-500/10",
  },
  blue: {
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-400",
    selected: "border-blue-500/60 bg-blue-500/10",
  },
  amber: {
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    dot: "bg-amber-400",
    selected: "border-amber-500/60 bg-amber-500/10",
  },
  violet: {
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    dot: "bg-violet-400",
    selected: "border-violet-500/60 bg-violet-500/10",
  },
};

export function PaperList({
  papers,
  selectedId,
  onSelect,
  contentType = "all",
}: PaperListProps) {
  const [hoveredPaper, setHoveredPaper] = useState<Paper | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  if (papers.length === 0) {
    const emptyMessage =
      contentType === "news"
        ? "해당 조건의 뉴스 기사가 없습니다."
        : contentType === "papers"
          ? "해당 주제의 논문이 없습니다."
          : "표시할 항목이 없습니다.";

    return (
      <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className="scroll-area flex-1 overflow-y-auto overscroll-y-contain px-3 py-3 space-y-2.5 sm:px-3 sm:py-3 sm:space-y-2"
        onMouseMove={canHover ? handleMouseMove : undefined}
      >
        {papers.map((paper) => {
          const colorKey = CATEGORY_COLORS[paper.category];
          const colors = colorMap[colorKey];
          const isSelected = paper.id === selectedId;
          const isNews = paper.isNewsArticle === true;

          return (
            <button
              key={paper.id}
              type="button"
              onClick={() => onSelect(paper)}
              onMouseEnter={canHover ? () => setHoveredPaper(paper) : undefined}
              onMouseLeave={canHover ? () => setHoveredPaper(null) : undefined}
              className={`w-full rounded-lg border p-4 text-left transition-colors duration-150 active:bg-slate-800/80 sm:p-3 ${
                canHover ? "hover:scale-[1.01]" : ""
              } ${
                isSelected
                  ? isNews
                    ? "border-rose-500/60 bg-rose-500/10 shadow-md ring-1 ring-inset ring-rose-500/30"
                    : `${colors.selected} shadow-md ring-1 ring-inset ring-slate-600`
                  : isNews
                    ? "border-rose-500/20 bg-rose-950/20 hover:border-rose-500/40 hover:bg-rose-950/30"
                    : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <CountryFlag
                  countryCode={paper.countryCode}
                  title={paper.title}
                  abstract={paper.abstract}
                  journal={paper.journal}
                />
                {isNews && (
                  <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                    뉴스
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${colors.badge}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                  {CATEGORY_LABELS[paper.category]}
                  {paper.subCategory && (
                    <span className="text-slate-400">
                      · {SUB_CATEGORY_LABELS[paper.subCategory]}
                    </span>
                  )}
                </span>
                <PaperMetaBadges
                  citationCount={paper.citationCount}
                  popularityScore={paper.popularityScore}
                  isNewsArticle={paper.isNewsArticle}
                  originalUrl={paper.originalUrl}
                  sourceSite={paper.sourceSite}
                />
                <span className="text-[10px] text-slate-500">{paper.year}</span>
              </div>
              <h3 className="text-[15px] font-semibold leading-snug text-slate-100 sm:text-sm">
                {paper.titleKo}
              </h3>
              <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500 sm:mt-1 sm:line-clamp-1 sm:text-xs">
                {paper.authors.join(", ")}
                <span className="text-slate-600"> · </span>
                <span className="text-slate-400">
                  {getPublicationSourceLabel(paper)}
                </span>
              </p>
            </button>
          );
        })}
      </div>

      {canHover && hoveredPaper && (
        <AbstractPopup paper={hoveredPaper} x={mousePos.x} y={mousePos.y} />
      )}
    </div>
  );
}

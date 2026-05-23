"use client";

import { useEffect, useState } from "react";
import {
  Paper,
  MainCategory,
  SubCategory,
  CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/types/paper";
import { AbstractPopup } from "./AbstractPopup";
import { CountryFlag } from "./CountryFlag";
import { PaperMetaBadges } from "./PaperMetaBadges";

interface PaperListProps {
  papers: Paper[];
  selectedId: string | null;
  onSelect: (paper: Paper) => void;
  activeCategory: MainCategory | "all";
  activeSubCategory: SubCategory | "all";
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
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-slate-500">
        해당 주제의 논문이 없습니다.
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        className="flex-1 overflow-y-auto p-2 space-y-2 sm:p-3"
        onMouseMove={canHover ? handleMouseMove : undefined}
      >
        {papers.map((paper) => {
          const colorKey = CATEGORY_COLORS[paper.category];
          const colors = colorMap[colorKey];
          const isSelected = paper.id === selectedId;

          return (
            <button
              key={paper.id}
              type="button"
              onClick={() => onSelect(paper)}
              onMouseEnter={canHover ? () => setHoveredPaper(paper) : undefined}
              onMouseLeave={canHover ? () => setHoveredPaper(null) : undefined}
              className={`w-full rounded-lg border p-3.5 text-left transition-colors duration-150 active:bg-slate-800/80 sm:p-3 ${
                canHover ? "hover:scale-[1.01]" : ""
              } ${
                isSelected
                  ? `${colors.selected} shadow-md ring-1 ring-inset ring-slate-600`
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
                  originalUrl={paper.originalUrl}
                  sourceSite={paper.sourceSite}
                />
                <span className="text-[10px] text-slate-500">{paper.year}</span>
              </div>
              <h3 className="text-sm font-semibold leading-snug text-slate-100">
                {paper.titleKo}
              </h3>
              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                {paper.authors.join(", ")}
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

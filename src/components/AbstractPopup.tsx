"use client";

import { useEffect, useRef, useState } from "react";
import { Paper } from "@/types/paper";

interface AbstractPopupProps {
  paper: Paper;
  x: number;
  y: number;
}

export function AbstractPopup({ paper, x, y }: AbstractPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = x + 16;
    let top = y + 16;

    if (left + rect.width > vw - 12) left = x - rect.width - 16;
    if (top + rect.height > vh - 12) top = y - rect.height - 16;
    if (left < 12) left = 12;
    if (top < 12) top = 12;

    setPos({ x: left, y: top });
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 w-[calc(100vw-24px)] max-w-[360px] max-h-[280px] overflow-y-auto rounded-xl border border-slate-600/60 bg-slate-800/95 p-4 shadow-2xl backdrop-blur-sm sm:w-[360px]"
      style={{ left: pos.x, top: pos.y }}
      role="tooltip"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
        Abstract
      </p>
      <p className="text-sm leading-relaxed text-slate-200">{paper.abstractKo}</p>
      <div className="mt-3 border-t border-slate-700 pt-2">
        <p className="text-xs text-slate-400">
          {paper.authors.join(", ")} · {paper.year}
        </p>
      </div>
    </div>
  );
}

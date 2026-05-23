"use client";

import {
  getPaperSortLabel,
  PaperSortField,
  PaperSortState,
  togglePaperSort,
} from "@/lib/paper-sort";

interface PaperSortFilterProps {
  sort: PaperSortState;
  onSortChange: (sort: PaperSortState) => void;
}

const SORT_FIELDS: PaperSortField[] = ["newest", "citations"];

function getSortButtonLabel(field: PaperSortField, sort: PaperSortState): string {
  if (field === "newest") {
    if (sort.field === "newest" && sort.direction === "asc") {
      return "오래된순";
    }
    return "최신순";
  }

  return "인용순";
}

export function PaperSortFilter({ sort, onSortChange }: PaperSortFilterProps) {
  return (
    <div className="border-b border-slate-800 px-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          정렬
        </span>
        <div className="flex rounded-lg border border-slate-700 bg-slate-800/50 p-0.5">
          {SORT_FIELDS.map((field) => {
            const active = sort.field === field;
            return (
              <button
                key={field}
                type="button"
                onClick={() => onSortChange(togglePaperSort(sort, field))}
                className={`min-h-9 rounded-md px-2.5 py-2 text-[11px] font-medium transition sm:py-1 ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                aria-pressed={active}
              >
                {getSortButtonLabel(field, sort)}
              </button>
            );
          })}
        </div>
      </div>
      {sort.field === "newest" && (
        <p className="mt-2 text-[10px] text-slate-600">
          {getPaperSortLabel(sort)} · 최신순을 다시 누르면 순서가 바뀝니다
        </p>
      )}
    </div>
  );
}

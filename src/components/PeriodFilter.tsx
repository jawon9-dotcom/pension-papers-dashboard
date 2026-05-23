"use client";

import { DEFAULT_YEAR_FROM, getDefaultYearTo, parseYear } from "@/lib/period";

interface PeriodFilterProps {
  yearFrom: number;
  yearTo: number;
  onYearFromChange: (year: number) => void;
  onYearToChange: (year: number) => void;
  onApply: () => void;
  loading?: boolean;
}

export function PeriodFilter({
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
  onApply,
  loading = false,
}: PeriodFilterProps) {
  const maxYear = getDefaultYearTo() + 1;

  return (
    <div className="border-b border-slate-800 p-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        검색 기간
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={2000}
          max={maxYear}
          value={yearFrom}
          onChange={(e) =>
            onYearFromChange(parseYear(e.target.value, DEFAULT_YEAR_FROM))
          }
          className="w-20 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          aria-label="시작 연도"
        />
        <span className="text-xs text-slate-500">~</span>
        <input
          type="number"
          min={2000}
          max={maxYear}
          value={yearTo}
          onChange={(e) =>
            onYearToChange(parseYear(e.target.value, getDefaultYearTo()))
          }
          className="w-20 rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          aria-label="종료 연도"
        />
        <button
          type="button"
          onClick={onApply}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "검색 중..." : "적용"}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-slate-600">
        기본 {DEFAULT_YEAR_FROM}~{getDefaultYearTo()}년 · 연도 변경 후 적용을 누르세요
      </p>
    </div>
  );
}

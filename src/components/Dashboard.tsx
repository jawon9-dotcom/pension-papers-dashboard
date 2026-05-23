"use client";

import { useCallback, useMemo, useState } from "react";
import { Paper, MainCategory, SubCategory, CATEGORY_LABELS } from "@/types/paper";
import { CitationGraphNode } from "@/types/citation-graph";
import {
  clampYearRange,
  DEFAULT_YEAR_FROM,
  filterPapersByYear,
  getDefaultYearTo,
} from "@/lib/period";
import {
  DEFAULT_PAPER_SORT,
  getPaperSortLabel,
  PaperSortState,
  sortPapers,
} from "@/lib/paper-sort";
import { CategoryFilter } from "./CategoryFilter";
import { OpenAiKeySettings } from "./OpenAiKeySettings";
import { PeriodFilter } from "./PeriodFilter";
import { PaperList } from "./PaperList";
import { PaperSortFilter } from "./PaperSortFilter";
import { PaperViewer } from "./PaperViewer";
import { useOpenAiApiKey } from "@/hooks/useOpenAiApiKey";

interface PapersMeta {
  source: string;
  count: number;
  fetchedAt: string;
  message?: string;
  yearFrom?: number;
  yearTo?: number;
}

interface DashboardProps {
  initialPapers: Paper[];
  initialMeta: PapersMeta;
}

export function Dashboard({ initialPapers, initialMeta }: DashboardProps) {
  const { apiKey, hasApiKey, maskedKey, saveApiKey, clearApiKey } =
    useOpenAiApiKey();
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [meta, setMeta] = useState<PapersMeta>(initialMeta);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [yearFrom, setYearFrom] = useState(
    initialMeta.yearFrom ?? DEFAULT_YEAR_FROM
  );
  const [yearTo, setYearTo] = useState(
    initialMeta.yearTo ?? getDefaultYearTo()
  );
  const [appliedPeriod, setAppliedPeriod] = useState(() =>
    clampYearRange(
      initialMeta.yearFrom ?? DEFAULT_YEAR_FROM,
      initialMeta.yearTo ?? getDefaultYearTo()
    )
  );

  const [activeCategory, setActiveCategory] = useState<MainCategory | "all">(
    "all"
  );
  const [activeSubCategory, setActiveSubCategory] = useState<
    SubCategory | "all"
  >("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPapers[0]?.id ?? null
  );
  const [sort, setSort] = useState<PaperSortState>(DEFAULT_PAPER_SORT);
  const [mobilePanel, setMobilePanel] = useState<"list" | "detail">("list");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const loadPapers = useCallback(
    async (refresh = false, period = appliedPeriod) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        yearFrom: String(period.yearFrom),
        yearTo: String(period.yearTo),
      });
      if (refresh) params.set("refresh", "true");

      try {
        const res = await fetch(`/api/papers?${params.toString()}`);
        if (!res.ok) throw new Error("논문 목록을 불러오지 못했습니다.");

        const data = await res.json();
        setPapers(data.papers);
        setMeta(data.meta);
        setAppliedPeriod(period);
        setSelectedId(data.papers[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedPeriod]
  );

  const handleApplyPeriod = () => {
    const period = clampYearRange(yearFrom, yearTo);
    setYearFrom(period.yearFrom);
    setYearTo(period.yearTo);
    loadPapers(true, period);
  };

  const papersInPeriod = useMemo(
    () =>
      filterPapersByYear(
        papers,
        appliedPeriod.yearFrom,
        appliedPeriod.yearTo
      ),
    [papers, appliedPeriod]
  );

  const filteredPapers = useMemo(() => {
    const filtered = papersInPeriod.filter((p) => {
      if (activeCategory !== "all" && p.category !== activeCategory)
        return false;
      if (
        activeCategory === "asset-management" &&
        activeSubCategory !== "all" &&
        p.subCategory !== activeSubCategory
      )
        return false;
      return true;
    });

    return sortPapers(filtered, sort);
  }, [papersInPeriod, activeCategory, activeSubCategory, sort]);

  const selectedPaper = useMemo(() => {
    if (filteredPapers.length === 0) return null;
    if (selectedId) {
      const found = filteredPapers.find((p) => p.id === selectedId);
      if (found) return found;
    }
    return filteredPapers[0];
  }, [filteredPapers, selectedId]);

  const counts = useMemo(() => {
    const result: Record<MainCategory | "all", number> = {
      all: papersInPeriod.length,
      "asset-allocation": 0,
      "asset-management": 0,
      "risk-management": 0,
      "performance-evaluation": 0,
    };
    papersInPeriod.forEach((p) => {
      result[p.category]++;
    });
    return result;
  }, [papersInPeriod]);

  const handleCategoryChange = (cat: MainCategory | "all") => {
    setActiveCategory(cat);
    if (cat !== "asset-management") {
      setActiveSubCategory("all");
    }
  };

  const handlePaperUpdate = (updated: Paper) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setSelectedId(updated.id);
  };

  const handleSelectPaper = (paper: Paper) => {
    setSelectedId(paper.id);
    setMobilePanel("detail");
  };

  const handleSelectConnected = (node: CitationGraphNode) => {
    const found = papers.find(
      (p) => p.id === node.id || p.openAlexId === node.id
    );
    if (found) {
      handleSelectPaper(found);
      return;
    }
    window.open(node.originalUrl, "_blank", "noopener,noreferrer");
  };

  const formatFetchedAt = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-slate-950">
      <header className="flex shrink-0 flex-col gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="min-w-0">
          <h1 className="text-base font-bold leading-snug text-white sm:text-lg">
            글로벌 연기금 운용 논문 모음 대시보드
          </h1>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
            {loading
              ? "논문 수집 중..."
              : `${appliedPeriod.yearFrom}~${appliedPeriod.yearTo}년 · ${meta.source === "openalex" || meta.source === "mixed" ? "OpenAlex+CrossRef" : meta.source === "crossref" ? "CrossRef" : meta.source === "cache" ? "캐시" : meta.source} · ${papersInPeriod.length} papers · ${formatFetchedAt(meta.fetchedAt)}`}
            {(meta.source === "openalex" ||
              meta.source === "crossref" ||
              meta.source === "mixed") && (
              <span className="ml-1.5 text-emerald-500 sm:ml-2">● 실시간</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <OpenAiKeySettings
            hasApiKey={hasApiKey}
            maskedKey={maskedKey}
            onSave={saveApiKey}
            onClear={clearApiKey}
          />
          <button
            type="button"
            onClick={() => loadPapers(true)}
            disabled={refreshing || loading}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 disabled:opacity-50 sm:py-1.5"
          >
            <svg
              className={`h-3.5 w-3.5 shrink-0 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="sm:hidden">
              {refreshing ? "수집 중" : "수집"}
            </span>
            <span className="hidden sm:inline">
              {refreshing ? "수집 중..." : "최신 논문 수집"}
            </span>
          </button>
          <div className="hidden items-center gap-4 md:flex">
            <Stat label="자산배분" value={counts["asset-allocation"]} color="text-emerald-400" />
            <Stat label="자산운용" value={counts["asset-management"]} color="text-blue-400" />
            <Stat label="리스크관리" value={counts["risk-management"]} color="text-amber-400" />
            <Stat label="성과평가" value={counts["performance-evaluation"]} color="text-violet-400" />
          </div>
        </div>
      </header>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-800 px-4 py-2 md:hidden">
        <Stat label="자산배분" value={counts["asset-allocation"]} color="text-emerald-400" compact />
        <Stat label="자산운용" value={counts["asset-management"]} color="text-blue-400" compact />
        <Stat label="리스크관리" value={counts["risk-management"]} color="text-amber-400" compact />
        <Stat label="성과평가" value={counts["performance-evaluation"]} color="text-violet-400" compact />
      </div>

      {error && (
        <div className="border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-400 sm:px-6">
          {error}
        </div>
      )}

      {meta.message && (
        <div className="border-b border-amber-900/50 bg-amber-950/20 px-4 py-2 text-xs text-amber-400 sm:px-6">
          {meta.message}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside
          className={`flex min-h-0 w-full flex-col border-b border-slate-800 lg:w-[380px] lg:shrink-0 lg:border-b-0 lg:border-r ${
            mobilePanel === "detail" ? "hidden lg:flex" : "flex flex-1"
          }`}
        >
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className="flex min-h-11 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 text-left lg:hidden"
            aria-expanded={mobileFiltersOpen}
          >
            <span className="text-sm font-medium text-slate-200">
              {mobileFiltersOpen ? "필터 접기" : "필터 · 검색 조건"}
            </span>
            <span className="text-xs text-slate-500">
              {appliedPeriod.yearFrom}~{appliedPeriod.yearTo}
              {activeCategory !== "all" &&
                ` · ${CATEGORY_LABELS[activeCategory]}`}
            </span>
          </button>

          <div
            className={`shrink-0 overflow-y-auto lg:block ${
              mobileFiltersOpen ? "max-h-[45dvh] border-b border-slate-800 lg:max-h-none" : "hidden lg:block"
            }`}
          >
            <PeriodFilter
              yearFrom={yearFrom}
              yearTo={yearTo}
              onYearFromChange={setYearFrom}
              onYearToChange={setYearTo}
              onApply={handleApplyPeriod}
              loading={loading || refreshing}
            />
            <CategoryFilter
              activeCategory={activeCategory}
              activeSubCategory={activeSubCategory}
              onCategoryChange={handleCategoryChange}
              onSubCategoryChange={setActiveSubCategory}
              counts={counts}
            />
            <PaperSortFilter sort={sort} onSortChange={setSort} />
          </div>

          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-2.5">
            <span className="text-sm font-medium text-slate-300">
              논문 목록
            </span>
            <span className="text-xs text-slate-500">
              {loading
                ? "불러오는 중..."
                : `${filteredPapers.length}건 · ${getPaperSortLabel(sort)}`}
            </span>
          </div>

          <div className="flex min-h-[55dvh] flex-1 flex-col overflow-hidden lg:min-h-0">
          {loading ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
                <p className="text-xs text-slate-500">
                  선택한 기간의 논문을 수집 중...
                </p>
              </div>
            </div>
          ) : (
            <PaperList
              papers={filteredPapers}
              selectedId={selectedPaper?.id ?? null}
              onSelect={handleSelectPaper}
              activeCategory={activeCategory}
              activeSubCategory={activeSubCategory}
            />
          )}
          </div>
        </aside>

        <main
          className={`min-h-0 flex-col overflow-hidden bg-slate-900/30 ${
            mobilePanel === "list" ? "hidden lg:flex lg:flex-1" : "flex flex-1"
          }`}
        >
          <PaperViewer
            key={selectedPaper?.id ?? "empty"}
            paper={selectedPaper}
            openaiApiKey={apiKey}
            onPaperUpdate={handlePaperUpdate}
            onBack={() => setMobilePanel("list")}
            onSelectConnected={handleSelectConnected}
          />
        </main>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
  compact = false,
}: {
  label: string;
  value: number;
  color: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="shrink-0 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-center">
        <p className={`text-sm font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-slate-500">{label}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

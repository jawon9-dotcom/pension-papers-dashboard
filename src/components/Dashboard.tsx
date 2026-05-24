"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Paper, MainCategory, SubCategory, CATEGORY_LABELS, SUB_CATEGORY_LABELS, CATEGORY_SUB_CATEGORIES } from "@/types/paper";
import { needsKoreanTitle } from "@/lib/title-ko";
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
import { ContentTypeTabs, ContentType, getContentTypeLabel } from "./ContentTypeFilter";
import { OpenAiKeySettings } from "./OpenAiKeySettings";
import { PeriodFilter } from "./PeriodFilter";
import { PaperList } from "./PaperList";
import { PaperSortFilter } from "./PaperSortFilter";
import { PaperViewer } from "./PaperViewer";
import { MyListFolder } from "./MyListFolder";
import { useOpenAiApiKey } from "@/hooks/useOpenAiApiKey";
import { useMyList } from "@/hooks/useMyList";
import { resolveSavedPaper, SavedPaperItem } from "@/lib/my-list";

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
  autoFetchOnMount?: boolean;
}

export function Dashboard({
  initialPapers,
  initialMeta,
  autoFetchOnMount = false,
}: DashboardProps) {
  const { apiKey, hasApiKey, maskedKey, saveApiKey, clearApiKey } =
    useOpenAiApiKey();
  const { items: myListItems, toggle: toggleMyList, remove: removeFromMyList, clear: clearMyList } =
    useMyList();
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [meta, setMeta] = useState<PapersMeta>(initialMeta);
  const [loading, setLoading] = useState(autoFetchOnMount);
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
  const [contentType, setContentType] = useState<ContentType>("all");
  const [mobilePanel, setMobilePanel] = useState<"list" | "detail">("list");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Paper | null>(null);
  const titleTranslationAttemptRef = useRef(new Set<string>());

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
        titleTranslationAttemptRef.current.clear();
        setPapers(data.papers);
        setMeta(data.meta);
        setAppliedPeriod(period);
        setSelectedId(data.papers[0]?.id ?? null);
        setSelectedSnapshot(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [appliedPeriod]
  );

  useEffect(() => {
    if (!autoFetchOnMount) return;
    void loadPapers(false);
  }, [autoFetchOnMount, loadPapers]);

  useEffect(() => {
    if (!apiKey) return;

    const pending = papers.filter(
      (paper) =>
        needsKoreanTitle(paper) &&
        !titleTranslationAttemptRef.current.has(paper.id)
    );
    if (pending.length === 0) return;

    pending
      .slice(0, 50)
      .forEach((paper) => titleTranslationAttemptRef.current.add(paper.id));

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/papers/titles-ko", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            papers: pending.slice(0, 50).map((paper) => ({
              id: paper.id,
              title: paper.title,
              titleKo: paper.titleKo,
            })),
            openaiApiKey: apiKey,
          }),
        });

        if (!res.ok || cancelled) return;

        const data = (await res.json()) as { titles?: Record<string, string> };
        const titles = data.titles ?? {};
        if (Object.keys(titles).length === 0) return;

        setPapers((prev) =>
          prev.map((paper) =>
            titles[paper.id] ? { ...paper, titleKo: titles[paper.id]! } : paper
          )
        );
      } catch {
        // 목록 제목 번역 실패 시 영문 제목 유지
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiKey, papers]);

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
      if (contentType === "papers" && p.isNewsArticle) return false;
      if (contentType === "news" && !p.isNewsArticle) return false;
      if (activeCategory !== "all" && p.category !== activeCategory)
        return false;
      if (
        (activeCategory === "asset-management" ||
          activeCategory === "asset-allocation") &&
        activeSubCategory !== "all" &&
        p.subCategory !== activeSubCategory
      )
        return false;
      return true;
    });

    return sortPapers(filtered, sort);
  }, [papersInPeriod, contentType, activeCategory, activeSubCategory, sort]);

  const savedIds = useMemo(
    () => new Set(myListItems.map((item) => item.id)),
    [myListItems]
  );

  const selectedPaper = useMemo(() => {
    if (selectedId && selectedSnapshot?.id === selectedId) {
      return selectedSnapshot;
    }

    if (selectedId) {
      const inFiltered = filteredPapers.find((p) => p.id === selectedId);
      if (inFiltered) return inFiltered;

      const inAll = papers.find((p) => p.id === selectedId);
      if (inAll) return inAll;
    }

    if (filteredPapers.length === 0) return null;
    return filteredPapers[0];
  }, [filteredPapers, papers, selectedId, selectedSnapshot]);

  const contentCountsForScope = useMemo(() => {
    const scoped =
      activeCategory === "all"
        ? papersInPeriod
        : papersInPeriod.filter((p) => p.category === activeCategory);

    return {
      all: scoped.length,
      papers: scoped.filter((p) => !p.isNewsArticle).length,
      news: scoped.filter((p) => p.isNewsArticle).length,
    };
  }, [papersInPeriod, activeCategory]);

  const listTitle = useMemo(() => {
    if (activeCategory === "all") return "전체";
    if (activeSubCategory !== "all") {
      return `${CATEGORY_LABELS[activeCategory]} · ${SUB_CATEGORY_LABELS[activeSubCategory]}`;
    }
    return CATEGORY_LABELS[activeCategory];
  }, [activeCategory, activeSubCategory]);

  const handleCategoryChange = (cat: MainCategory | "all") => {
    setActiveCategory(cat);
    if (cat !== "asset-management" && cat !== "asset-allocation") {
      setActiveSubCategory("all");
    }
  };

  const handleStatCategoryClick = (category: MainCategory) => {
    if (activeCategory === category && activeSubCategory === "all") {
      setActiveCategory("all");
      setActiveSubCategory("all");
    } else {
      setActiveCategory(category);
      setActiveSubCategory("all");
    }
    setSelectedId(null);
    setSelectedSnapshot(null);
    setMobilePanel("list");
  };

  const handleStatSubCategoryClick = (
    category: MainCategory,
    sub: SubCategory
  ) => {
    if (activeCategory === category && activeSubCategory === sub) {
      setActiveSubCategory("all");
    } else {
      setActiveCategory(category);
      setActiveSubCategory(sub);
    }
    setSelectedId(null);
    setSelectedSnapshot(null);
    setMobilePanel("list");
  };

  const handlePaperUpdate = (updated: Paper) => {
    setPapers((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setSelectedId(updated.id);
    setSelectedSnapshot((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleSelectPaper = (paper: Paper) => {
    setSelectedId(paper.id);
    setSelectedSnapshot(null);
    setMobilePanel("detail");
  };

  const handleSelectFromMyList = (item: SavedPaperItem) => {
    const paper = resolveSavedPaper(item, papers);
    setSelectedId(paper.id);
    setSelectedSnapshot(paper);
    setMobilePanel("detail");
  };

  const handleRemoveFromMyList = (id: string) => {
    removeFromMyList(id);
    if (selectedId === id) {
      setSelectedSnapshot(null);
    }
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
            글로벌 연기금 운용 논문 및 뉴스 대시보드
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
          <MyListFolder
            items={myListItems}
            onSelect={handleSelectFromMyList}
            onRemove={handleRemoveFromMyList}
            onClear={clearMyList}
          />
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
          <div className="hidden items-center gap-3 md:flex">
            <Stat
              category="asset-allocation"
              label={CATEGORY_LABELS["asset-allocation"]}
              subCategories={CATEGORY_SUB_CATEGORIES["asset-allocation"]}
              color="text-emerald-400"
              chipActiveClass="border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
              activeCategory={activeCategory}
              activeSubCategory={activeSubCategory}
              activeClass="border-emerald-400 bg-emerald-500/25 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
              onCategoryClick={handleStatCategoryClick}
              onSubCategoryClick={handleStatSubCategoryClick}
            />
            <Stat
              category="asset-management"
              label={CATEGORY_LABELS["asset-management"]}
              subCategories={CATEGORY_SUB_CATEGORIES["asset-management"]}
              color="text-blue-400"
              chipActiveClass="border-blue-400/60 bg-blue-500/20 text-blue-200"
              activeCategory={activeCategory}
              activeSubCategory={activeSubCategory}
              activeClass="border-blue-400 bg-blue-500/25 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
              onCategoryClick={handleStatCategoryClick}
              onSubCategoryClick={handleStatSubCategoryClick}
            />
            <Stat
              category="risk-management"
              label={CATEGORY_LABELS["risk-management"]}
              color="text-amber-400"
              activeCategory={activeCategory}
              activeSubCategory={activeSubCategory}
              activeClass="border-amber-400 bg-amber-500/25 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20"
              onCategoryClick={handleStatCategoryClick}
              onSubCategoryClick={handleStatSubCategoryClick}
            />
            <Stat
              category="performance-evaluation"
              label={CATEGORY_LABELS["performance-evaluation"]}
              color="text-violet-400"
              activeCategory={activeCategory}
              activeSubCategory={activeSubCategory}
              activeClass="border-violet-400 bg-violet-500/25 ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/20"
              onCategoryClick={handleStatCategoryClick}
              onSubCategoryClick={handleStatSubCategoryClick}
            />
          </div>
        </div>
      </header>

      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-slate-800 px-4 py-2 md:hidden">
        <Stat
          category="asset-allocation"
          label={CATEGORY_LABELS["asset-allocation"]}
          subCategories={CATEGORY_SUB_CATEGORIES["asset-allocation"]}
          color="text-emerald-400"
          chipActiveClass="border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
          compact
          activeCategory={activeCategory}
          activeSubCategory={activeSubCategory}
          activeClass="border-emerald-400 bg-emerald-500/25 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20"
          onCategoryClick={handleStatCategoryClick}
          onSubCategoryClick={handleStatSubCategoryClick}
        />
        <Stat
          category="asset-management"
          label={CATEGORY_LABELS["asset-management"]}
          subCategories={CATEGORY_SUB_CATEGORIES["asset-management"]}
          color="text-blue-400"
          chipActiveClass="border-blue-400/60 bg-blue-500/20 text-blue-200"
          compact
          activeCategory={activeCategory}
          activeSubCategory={activeSubCategory}
          activeClass="border-blue-400 bg-blue-500/25 ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/20"
          onCategoryClick={handleStatCategoryClick}
          onSubCategoryClick={handleStatSubCategoryClick}
        />
        <Stat
          category="risk-management"
          label={CATEGORY_LABELS["risk-management"]}
          color="text-amber-400"
          compact
          activeCategory={activeCategory}
          activeSubCategory={activeSubCategory}
          activeClass="border-amber-400 bg-amber-500/25 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20"
          onCategoryClick={handleStatCategoryClick}
          onSubCategoryClick={handleStatSubCategoryClick}
        />
        <Stat
          category="performance-evaluation"
          label={CATEGORY_LABELS["performance-evaluation"]}
          color="text-violet-400"
          compact
          activeCategory={activeCategory}
          activeSubCategory={activeSubCategory}
          activeClass="border-violet-400 bg-violet-500/25 ring-2 ring-violet-500/50 shadow-lg shadow-violet-500/20"
          onCategoryClick={handleStatCategoryClick}
          onSubCategoryClick={handleStatSubCategoryClick}
        />
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
              {contentType !== "all" && ` · ${getContentTypeLabel(contentType)}`}
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
            />
            <PaperSortFilter sort={sort} onSortChange={setSort} />
          </div>

          <div className="shrink-0 border-b border-slate-800 bg-slate-900/50 px-4 py-2.5">
            <ContentTypeTabs
              activeType={contentType}
              onTypeChange={setContentType}
              counts={contentCountsForScope}
            />
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/40 px-4 py-2.5">
            <span className="min-w-0 text-sm font-medium text-slate-300">
              {listTitle}
            </span>
            <span className="shrink-0 text-xs text-slate-500">
              {loading
                ? "불러오는 중..."
                : `${filteredPapers.length}건 · ${getContentTypeLabel(contentType)} · ${getPaperSortLabel(sort)}`}
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
              contentType={contentType}
              savedIds={savedIds}
              onToggleSave={toggleMyList}
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
  category,
  label,
  color,
  subCategories,
  chipActiveClass = "",
  compact = false,
  activeCategory,
  activeSubCategory,
  activeClass = "",
  onCategoryClick,
  onSubCategoryClick,
}: {
  category: MainCategory;
  label: string;
  color: string;
  subCategories?: SubCategory[];
  chipActiveClass?: string;
  compact?: boolean;
  activeCategory: MainCategory | "all";
  activeSubCategory: SubCategory | "all";
  activeClass?: string;
  onCategoryClick: (category: MainCategory) => void;
  onSubCategoryClick: (category: MainCategory, sub: SubCategory) => void;
}) {
  const isActive = activeCategory === category;
  const isMainActive = isActive && activeSubCategory === "all";

  const baseClass = compact
    ? "shrink-0 rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-2 text-center transition duration-150"
    : "rounded-lg border border-slate-700/80 bg-slate-900/50 px-3 py-2 text-center transition duration-150";

  return (
    <div
      className={`${baseClass} ${isActive ? `${activeClass} scale-[1.03]` : "hover:border-slate-600 hover:bg-slate-800/80"}`}
    >
      <button
        type="button"
        onClick={() => onCategoryClick(category)}
        aria-pressed={isMainActive}
        className={`w-full text-[10px] font-semibold transition ${
          isActive ? color : "text-slate-500 hover:text-slate-300"
        }`}
      >
        {label}
      </button>
      {subCategories && subCategories.length > 0 && (
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {subCategories.map((sub) => {
            const isSubActive = isActive && activeSubCategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => onSubCategoryClick(category, sub)}
                aria-pressed={isSubActive}
                className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition sm:text-[10px] ${
                  isSubActive
                    ? chipActiveClass
                    : "border-transparent text-slate-600 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-400"
                }`}
              >
                {SUB_CATEGORY_LABELS[sub]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

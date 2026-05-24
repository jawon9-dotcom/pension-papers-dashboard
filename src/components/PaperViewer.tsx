"use client";

import { useCallback, useState } from "react";
import {
  Paper,
  CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/types/paper";
import { CountryFlag } from "./CountryFlag";
import { PaperMetaBadges } from "./PaperMetaBadges";
import { ConnectedPapersPanel } from "./ConnectedPapersPanel";
import { NewsArticleViewer } from "./NewsArticleViewer";
import { CitationGraphNode } from "@/types/citation-graph";
import { getCountryNameKo, resolveCountryCode } from "@/lib/country";
import { getListDisplayTitle } from "@/lib/title-ko";
import { getDisplayAbstractKo } from "@/lib/korean-publication";

interface PaperViewerProps {
  paper: Paper | null;
  openaiApiKey?: string | null;
  onPaperUpdate?: (paper: Paper) => void;
  onBack?: () => void;
  onSelectConnected?: (node: CitationGraphNode) => void;
}

const headerColors: Record<string, string> = {
  emerald: "from-emerald-600/20 to-transparent border-emerald-500/30",
  blue: "from-blue-600/20 to-transparent border-blue-500/30",
  amber: "from-amber-600/20 to-transparent border-amber-500/30",
  violet: "from-violet-600/20 to-transparent border-violet-500/30",
};

export function PaperViewer({
  paper,
  openaiApiKey,
  onPaperUpdate,
  onBack,
  onSelectConnected,
}: PaperViewerProps) {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summarySource, setSummarySource] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string>("");
  const [titleKo, setTitleKo] = useState<string>("");
  const [abstractKo, setAbstractKo] = useState<string>("");
  const [hasAiSummary, setHasAiSummary] = useState(false);
  const [summaryRequested, setSummaryRequested] = useState(false);

  const fetchSummary = useCallback(
    async (force = false) => {
      if (!paper) return;

      if (!openaiApiKey) {
        setSummaryRequested(true);
        setSummarySource("fallback");
        setSummaryText(
          "AI 한글 요약을 사용하려면 상단에서 OpenAI API 키를 입력해 주세요."
        );
        return;
      }

      setSummaryLoading(true);
      setSummaryRequested(true);
      try {
        const res = await fetch("/api/papers/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paper, force, openaiApiKey }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "요약 생성 실패");
        }

        setTitleKo(data.titleKo);
        setAbstractKo(data.abstractKo);
        setSummaryText(data.summaryKo);
        setHasAiSummary(data.hasAiSummary);
        setSummarySource(data.source);

        onPaperUpdate?.({
          ...paper,
          titleKo: data.titleKo,
          abstractKo: data.abstractKo,
          summaryKo: data.summaryKo,
          hasAiSummary: data.hasAiSummary,
        });
      } catch (error) {
        setSummarySource("error");
        setSummaryText(
          error instanceof Error
            ? error.message
            : "AI 요약 생성에 실패했습니다. API 키를 확인하거나 잠시 후 다시 시도해 주세요."
        );
      } finally {
        setSummaryLoading(false);
      }
    },
    [paper, openaiApiKey, onPaperUpdate]
  );

  if (!paper) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center sm:p-12">
        <div className="rounded-full bg-slate-800 p-5 sm:p-6">
          <svg
            className="h-12 w-12 text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <div>
          <p className="text-lg font-medium text-slate-400">
            항목을 선택해 주세요
          </p>
          <p className="mt-1 text-sm text-slate-600">
            목록에서 논문 또는 뉴스를 선택하면 상세 내용을 확인할 수 있습니다
          </p>
        </div>
      </div>
    );
  }

  if (paper.isNewsArticle) {
    return (
      <NewsArticleViewer
        paper={paper}
        openaiApiKey={openaiApiKey}
        onPaperUpdate={onPaperUpdate}
        onBack={onBack}
      />
    );
  }

  const displayTitleKo = titleKo || getListDisplayTitle(paper);
  const displayAbstractKo = abstractKo || getDisplayAbstractKo(paper);
  const displaySummary = summaryText || paper.summaryKo;
  const showGenerateButton = !displaySummary && !summaryLoading && !summaryRequested;

  const colorKey = CATEGORY_COLORS[paper.category];
  const headerClass = headerColors[colorKey];
  const countryCode = resolveCountryCode(paper);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {onBack && (
        <div className="shrink-0 border-b border-slate-800 bg-slate-900/50 px-4 py-2.5 lg:hidden">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-slate-300 active:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            목록으로
          </button>
        </div>
      )}

      <div
        className={`hidden shrink-0 border-b bg-gradient-to-r px-4 py-4 sm:px-6 sm:py-5 lg:block ${headerClass}`}
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <CountryFlag
            countryCode={paper.countryCode}
            title={paper.title}
            abstract={paper.abstract}
            journal={paper.journal}
            size="md"
          />
          <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            {CATEGORY_LABELS[paper.category]}
            {paper.subCategory &&
              ` · ${SUB_CATEGORY_LABELS[paper.subCategory]}`}
          </span>
          <PaperMetaBadges
            citationCount={paper.citationCount}
            popularityScore={paper.popularityScore}
            isNewsArticle={paper.isNewsArticle}
            originalUrl={paper.originalUrl}
            sourceSite={paper.sourceSite}
            size="md"
          />
          {countryCode && (
            <span className="text-xs text-slate-500">
              {getCountryNameKo(countryCode)}
            </span>
          )}
          <span className="text-xs text-slate-500">{paper.year}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-500">{paper.journal}</span>
          {paper.openAlexId && (
            <>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-emerald-500">OpenAlex</span>
            </>
          )}
        </div>
        <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">
          {displayTitleKo}
        </h2>
        <p className="mt-1 text-sm italic text-slate-400">{paper.title}</p>
        <p className="mt-2 text-xs text-slate-500">
          {paper.authors.join(", ")}
        </p>
      </div>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div
          className={`border-b bg-gradient-to-r px-4 py-4 sm:px-6 sm:py-5 lg:hidden ${headerClass}`}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CountryFlag
              countryCode={paper.countryCode}
              title={paper.title}
              abstract={paper.abstract}
              journal={paper.journal}
              size="md"
            />
            <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-300">
              {CATEGORY_LABELS[paper.category]}
              {paper.subCategory &&
                ` · ${SUB_CATEGORY_LABELS[paper.subCategory]}`}
            </span>
            <PaperMetaBadges
              citationCount={paper.citationCount}
              popularityScore={paper.popularityScore}
              isNewsArticle={paper.isNewsArticle}
              originalUrl={paper.originalUrl}
              sourceSite={paper.sourceSite}
              size="md"
            />
            {countryCode && (
              <span className="text-xs text-slate-500">
                {getCountryNameKo(countryCode)}
              </span>
            )}
            <span className="text-xs text-slate-500">{paper.year}</span>
          </div>
          <h2 className="text-lg font-bold leading-snug text-white">
            {displayTitleKo}
          </h2>
          <p className="mt-1 text-sm italic text-slate-400">{paper.title}</p>
          <p className="mt-2 text-xs text-slate-500">
            {paper.authors.join(", ")}
          </p>
        </div>

        <div className="border-b border-slate-800 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-400">
              AI 핵심 요약
              {hasAiSummary && (
                <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-normal text-blue-300">
                  AI 생성
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => fetchSummary(true)}
              disabled={summaryLoading}
              className="min-h-9 shrink-0 px-2 text-xs text-slate-500 hover:text-blue-400 disabled:opacity-50"
            >
              {summaryLoading ? "생성 중..." : displaySummary ? "다시 생성" : "요약 생성"}
            </button>
          </div>

          {showGenerateButton ? (
            <button
              type="button"
              onClick={() => fetchSummary()}
              className="w-full rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-300 transition hover:bg-blue-500/20 active:bg-blue-500/25 sm:w-auto"
            >
              AI 요약 생성하기
            </button>
          ) : summaryLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
              <p className="text-sm text-slate-500">
                AI가 논문을 분석하고 있습니다...
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-slate-300">
                {displaySummary || "요약을 생성할 수 없습니다."}
              </p>
              {summarySource === "fallback" && (
                <p className="mt-2 text-xs text-amber-500">
                  OpenAI API 키가 없어 초록 기반 기본 요약을 표시합니다. 상단에서
                  키를 입력하면 AI 한글 요약을 사용할 수 있습니다.
                </p>
              )}
              {summarySource === "error" && (
                <p className="mt-2 text-xs text-red-400">
                  요약 API 호출에 실패했습니다. 네트워크 또는 API 키 설정을 확인해 주세요.
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-b border-slate-800 px-4 py-4 sm:px-6 sm:py-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-400">
            초록 (Abstract)
          </h3>
          <p className="text-sm leading-relaxed text-slate-400">
            {displayAbstractKo}
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs text-slate-600 hover:text-slate-400">
              영문 초록 보기
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {paper.abstract}
            </p>
          </details>
        </div>

        <ConnectedPapersPanel
          paper={paper}
          onSelectNode={onSelectConnected}
        />

        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-slate-300">논문 원본</h3>
            <a
              href={paper.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-500 active:bg-blue-400 sm:w-auto sm:py-1.5"
            >
              원문 페이지 열기
            </a>
          </div>

          {paper.pdfUrl ? (
            <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
              <iframe
                src={paper.pdfUrl}
                title={displayTitleKo}
                className="h-[45vh] min-h-[240px] w-full sm:h-[480px]"
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
              <p className="border-t border-slate-700 px-4 py-2 text-xs text-slate-500">
                일부 논문은 iframe 임베드가 제한될 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-8 text-center">
              <p className="text-sm text-slate-400">
                PDF가 제공되지 않는 논문입니다. DOI/학술 DB 링크를 통해 원문에
                접근할 수 있습니다.
              </p>
              <a
                href={paper.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-blue-400 hover:underline"
              >
                {paper.originalUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

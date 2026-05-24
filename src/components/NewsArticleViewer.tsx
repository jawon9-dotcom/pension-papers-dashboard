"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Paper,
  CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  getPublicationSourceLabel,
} from "@/types/paper";
import { formatPopularityScore } from "@/lib/source";
import { PaperMetaBadges } from "./PaperMetaBadges";

interface NewsArticleViewerProps {
  paper: Paper;
  openaiApiKey?: string | null;
  onPaperUpdate?: (paper: Paper) => void;
  onBack?: () => void;
}

function NewsHeader({
  paper,
  displayTitleKo,
}: {
  paper: Paper;
  displayTitleKo: string;
}) {
  return (
    <div className="border-b bg-gradient-to-r from-rose-600/20 to-transparent px-4 py-4 sm:px-6 sm:py-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
          뉴스
        </span>
        <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs font-medium text-slate-300">
          {CATEGORY_LABELS[paper.category]}
          {paper.subCategory &&
            ` · ${SUB_CATEGORY_LABELS[paper.subCategory]}`}
        </span>
        <PaperMetaBadges
          popularityScore={paper.popularityScore}
          isNewsArticle
          originalUrl={paper.originalUrl}
          sourceSite={paper.sourceSite}
          size="md"
          showLink={false}
        />
        <span className="text-xs text-slate-500">{paper.year}</span>
        <span className="text-xs text-slate-500">·</span>
        <span className="text-xs text-slate-400">
          {getPublicationSourceLabel(paper)}
        </span>
      </div>
      <h2 className="text-lg font-bold leading-snug text-white sm:text-xl">
        {displayTitleKo}
      </h2>
      {paper.title !== displayTitleKo && (
        <p className="mt-1 text-sm italic text-slate-400">{paper.title}</p>
      )}
      {paper.authors[0] && (
        <p className="mt-2 text-xs text-slate-500">{paper.authors.join(", ")}</p>
      )}
    </div>
  );
}

function getFallbackArticleBody(paper: Paper): string {
  if (paper.abstractKo && paper.abstractKo !== paper.titleKo) {
    return paper.abstractKo;
  }
  if (paper.abstract && paper.abstract !== paper.title) {
    return paper.abstract;
  }
  return paper.title;
}

export function NewsArticleViewer({
  paper,
  openaiApiKey,
  onPaperUpdate,
  onBack,
}: NewsArticleViewerProps) {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summarySource, setSummarySource] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState("");
  const [titleKo, setTitleKo] = useState("");
  const [hasAiSummary, setHasAiSummary] = useState(false);
  const [summaryRequested, setSummaryRequested] = useState(false);
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleContent, setArticleContent] = useState("");
  const [articleError, setArticleError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState(paper.originalUrl);

  const fetchSummary = useCallback(
    async (force = false) => {
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
        setSummaryText(data.summaryKo);
        setHasAiSummary(data.hasAiSummary);
        setSummarySource(data.source);

        onPaperUpdate?.({
          ...paper,
          titleKo: data.titleKo,
          abstractKo: data.abstractKo ?? paper.abstractKo,
          summaryKo: data.summaryKo,
          hasAiSummary: data.hasAiSummary,
        });
      } catch (error) {
        setSummarySource("error");
        setSummaryText(
          error instanceof Error
            ? error.message
            : "AI 요약 생성에 실패했습니다."
        );
      } finally {
        setSummaryLoading(false);
      }
    },
    [paper, openaiApiKey, onPaperUpdate]
  );

  const fetchArticleBody = useCallback(async () => {
    setArticleLoading(true);
    setArticleError(null);

    try {
      const params = new URLSearchParams({ url: paper.originalUrl });
      const res = await fetch(`/api/papers/article-content?${params.toString()}`);
      const data = (await res.json()) as {
        content?: string;
        resolvedUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "기사 원문을 불러오지 못했습니다.");
      }

      setArticleContent(data.content ?? "");
      setResolvedUrl(data.resolvedUrl ?? paper.originalUrl);
    } catch (error) {
      setArticleError(
        error instanceof Error
          ? error.message
          : "기사 원문을 불러오지 못했습니다."
      );
      setArticleContent(getFallbackArticleBody(paper));
    } finally {
      setArticleLoading(false);
    }
  }, [paper]);

  useEffect(() => {
    setSummaryLoading(false);
    setSummarySource(null);
    setSummaryText("");
    setTitleKo("");
    setHasAiSummary(false);
    setSummaryRequested(false);
    setArticleLoading(false);
    setArticleContent("");
    setArticleError(null);
    setResolvedUrl(paper.originalUrl);
  }, [paper.id, paper.originalUrl]);

  useEffect(() => {
    if (paper.summaryKo) {
      setSummaryText(paper.summaryKo);
      setTitleKo(paper.titleKo);
      setHasAiSummary(paper.hasAiSummary ?? false);
      setSummaryRequested(true);
    } else if (openaiApiKey) {
      fetchSummary();
    }
  }, [paper.id, paper.summaryKo, openaiApiKey, fetchSummary]);

  useEffect(() => {
    fetchArticleBody();
  }, [fetchArticleBody]);

  const displayTitleKo = titleKo || paper.titleKo;
  const displaySummary = summaryText || paper.summaryKo;
  const showGenerateButton =
    !displaySummary && !summaryLoading && !summaryRequested;
  const displayArticleBody =
    articleContent || (!articleLoading ? getFallbackArticleBody(paper) : "");

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

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <NewsHeader paper={paper} displayTitleKo={displayTitleKo} />

        <div className="border-b border-slate-800 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-rose-300">
              AI 한글 요약
              {hasAiSummary && (
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-normal text-rose-200">
                  AI 생성
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => fetchSummary(true)}
              disabled={summaryLoading}
              className="min-h-9 shrink-0 px-2 text-xs text-slate-500 hover:text-rose-300 disabled:opacity-50"
            >
              {summaryLoading
                ? "생성 중..."
                : displaySummary
                  ? "다시 생성"
                  : "요약 생성"}
            </button>
          </div>

          {showGenerateButton ? (
            <button
              type="button"
              onClick={() => fetchSummary()}
              className="w-full rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 transition hover:bg-rose-500/20 sm:w-auto"
            >
              AI 한글 요약 생성하기
            </button>
          ) : summaryLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-rose-400" />
              <p className="text-sm text-slate-500">
                AI가 기사를 분석하고 있습니다...
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-slate-200">
                {displaySummary || "요약을 생성할 수 없습니다."}
              </p>
              {summarySource === "fallback" && (
                <p className="mt-2 text-xs text-amber-500">
                  OpenAI API 키를 입력하면 AI 한글 요약을 사용할 수 있습니다.
                </p>
              )}
              {summarySource === "error" && (
                <p className="mt-2 text-xs text-red-400">
                  요약 생성에 실패했습니다. API 키를 확인해 주세요.
                </p>
              )}
            </>
          )}
        </div>

        <div className="border-b border-slate-800 px-4 py-5 sm:px-6 sm:py-6">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            신문 · 기사 링크
          </h3>
          <a
            href={resolvedUrl || paper.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-rose-500 sm:w-auto"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            {paper.sourceSite ?? "원문"}에서 기사 보기
          </a>
          <p className="mt-3 break-all text-xs text-slate-500">
            {paper.originalUrl}
          </p>
          {resolvedUrl !== paper.originalUrl && (
            <p className="mt-1 break-all text-xs text-slate-600">
              실제 기사 URL: {resolvedUrl}
            </p>
          )}
          {(paper.popularityScore ?? 0) > 0 && (
            <p className="mt-2 text-xs text-rose-400/80">
              인기도 {formatPopularityScore(paper.popularityScore)} · 외부
              매체에서 제공하는 기사입니다
            </p>
          )}
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-300">기사 원문</h3>
            <button
              type="button"
              onClick={fetchArticleBody}
              disabled={articleLoading}
              className="min-h-9 px-2 text-xs text-slate-500 hover:text-rose-300 disabled:opacity-50"
            >
              {articleLoading ? "불러오는 중..." : "원문 다시 불러오기"}
            </button>
          </div>

          {articleLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-rose-400" />
              <p className="text-sm text-slate-500">
                기사 원문을 불러오는 중입니다...
              </p>
            </div>
          ) : (
            <>
              {articleError && (
                <p className="mb-3 text-xs text-amber-500">
                  {articleError} 아래는 수집된 요약/발췌문을 표시합니다.
                </p>
              )}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-4 sm:px-5 sm:py-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                  {displayArticleBody}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

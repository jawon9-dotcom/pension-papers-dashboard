"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SavedPaperItem, savedItemToPaper } from "@/lib/my-list";
import { getListDisplayTitle } from "@/lib/title-ko";
import {
  CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  getPublicationSourceLabel,
  formatNewsPublishDate,
} from "@/types/paper";

interface MyListFolderProps {
  items: SavedPaperItem[];
  onSelect: (item: SavedPaperItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function MyListFolder({
  items,
  onSelect,
  onRemove,
  onClear,
}: MyListFolderProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const handleSelect = (item: SavedPaperItem) => {
    onSelect(item);
    setOpen(false);
  };

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="닫기"
              className="fixed inset-0 z-[200] bg-[#020617]"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-[201] flex items-start justify-center p-3 pt-14 sm:items-start sm:justify-end sm:p-4 sm:pt-[4.75rem]">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="나의 목록"
                className="pointer-events-auto flex w-full max-w-[400px] max-h-[min(82dvh,calc(100dvh-3.5rem))] flex-col overflow-hidden rounded-xl border-2 border-slate-600 bg-[#0f172a] shadow-[0_24px_80px_rgba(0,0,0,0.85)] sm:max-h-[min(72dvh,calc(100dvh-5rem))]"
              >
                <div className="shrink-0 border-b border-slate-600 bg-[#0f172a] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        나의 목록
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        체크한 논문·기사가 브라우저에 저장됩니다.
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {items.length > 0 && (
                        <button
                          type="button"
                          onClick={onClear}
                          className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:text-red-300"
                        >
                          전체 삭제
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="목록 닫기"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-[#0f172a] p-3">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-600 bg-slate-800 px-4 py-8 text-center">
                      <p className="text-sm text-slate-300">
                        저장된 항목이 없습니다.
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        목록에서 체크하면 여기에 추가됩니다.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((item) => {
                        const paper = savedItemToPaper(item);
                        const isNews = item.isNewsArticle === true;

                        return (
                          <li
                            key={item.id}
                            className={`rounded-lg border p-3 ${
                              isNews
                                ? "border-rose-500/50 bg-[#3f0d1a]"
                                : "border-slate-500 bg-slate-800"
                            }`}
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-1.5">
                              {isNews ? (
                                <span className="rounded-full border border-rose-500/50 bg-rose-900 px-2 py-0.5 text-[10px] font-semibold text-rose-200">
                                  뉴스
                                </span>
                              ) : (
                                <span className="rounded-full border border-slate-500 bg-slate-700 px-2 py-0.5 text-[10px] text-slate-200">
                                  논문
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {CATEGORY_LABELS[item.category]}
                                {item.subCategory &&
                                  ` · ${SUB_CATEGORY_LABELS[item.subCategory]}`}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {item.year}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelect(item)}
                              className="w-full text-left"
                            >
                              <p className="text-sm font-medium leading-snug text-white">
                                {getListDisplayTitle(paper)}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
                                {item.authors.join(", ")}
                                <span className="text-slate-500"> · </span>
                                {getPublicationSourceLabel(paper)}
                              </p>
                              {isNews && formatNewsPublishDate(paper) && (
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  {formatNewsPublishDate(paper)}
                                </p>
                              )}
                            </button>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-500">
                                {new Date(item.savedAt).toLocaleDateString(
                                  "ko-KR"
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:border-red-500/50 hover:text-red-300"
                              >
                                <svg
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                삭제
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition sm:py-1.5 ${
          open
            ? "border-sky-500 bg-sky-900 text-sky-100"
            : items.length > 0
              ? "border-sky-700/60 bg-sky-950/30 text-sky-300 hover:bg-sky-950/50"
              : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
        }`}
        aria-expanded={open}
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
            d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
          />
        </svg>
        <span className="hidden sm:inline">나의 목록</span>
        {items.length > 0 && (
          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200">
            {items.length}
          </span>
        )}
      </button>
      {panel}
    </>
  );
}

"use client";

import { useState } from "react";
import { SavedPaperItem } from "@/lib/my-list";
import {
  CATEGORY_LABELS,
  SUB_CATEGORY_LABELS,
  getPublicationSourceLabel,
} from "@/types/paper";
import { savedItemToPaper } from "@/lib/my-list";

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

  const handleSelect = (item: SavedPaperItem) => {
    onSelect(item);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition sm:py-1.5 ${
          items.length > 0
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

      {open && (
        <>
          <button
            type="button"
            aria-label="닫기"
            className="fixed inset-0 z-40 bg-black/60 sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-4 bottom-4 z-50 flex max-h-[85vh] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] sm:max-h-[70vh]">
            <div className="border-b border-slate-800 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    나의 목록
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    체크한 논문·기사가 브라우저에 저장됩니다.
                  </p>
                </div>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="shrink-0 rounded-lg border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:text-red-300"
                  >
                    전체 삭제
                  </button>
                )}
              </div>
            </div>

            <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-3">
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-4 py-8 text-center">
                  <p className="text-sm text-slate-400">저장된 항목이 없습니다.</p>
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
                            ? "border-rose-500/25 bg-rose-950/20"
                            : "border-slate-700/60 bg-slate-800/40"
                        }`}
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                          {isNews ? (
                            <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                              뉴스
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                              논문
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {CATEGORY_LABELS[item.category]}
                            {item.subCategory &&
                              ` · ${SUB_CATEGORY_LABELS[item.subCategory]}`}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.year}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelect(item)}
                          className="w-full text-left"
                        >
                          <p className="text-sm font-medium leading-snug text-slate-100">
                            {item.titleKo || item.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                            {item.authors.join(", ")}
                            <span className="text-slate-600"> · </span>
                            {getPublicationSourceLabel(paper)}
                          </p>
                        </button>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-600">
                            {new Date(item.savedAt).toLocaleDateString("ko-KR")}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1 text-[11px] text-slate-400 hover:border-red-500/40 hover:text-red-300"
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
        </>
      )}
    </div>
  );
}

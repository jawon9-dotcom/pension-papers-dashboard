"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { isValidOpenAiKeyFormat } from "@/lib/openai-key";

interface OpenAiKeySettingsProps {
  hasApiKey: boolean;
  maskedKey: string;
  onSave: (key: string) => boolean;
  onClear: () => void;
}

export function OpenAiKeySettings({
  hasApiKey,
  maskedKey,
  onSave,
  onClear,
}: OpenAiKeySettingsProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setDraft("");
      setError(null);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleSave = () => {
    if (!isValidOpenAiKeyFormat(draft)) {
      setError("sk- 로 시작하는 유효한 OpenAI API 키를 입력해 주세요.");
      return;
    }

    const saved = onSave(draft);
    if (!saved) {
      setError("API 키 저장에 실패했습니다.");
      return;
    }

    setOpen(false);
    setDraft("");
    setError(null);
  };

  const panel =
    open && mounted
      ? createPortal(
          <>
            <button
              type="button"
              aria-label="닫기"
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 sm:items-start sm:justify-end sm:p-4 sm:pt-[4.75rem]">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="OpenAI API 키 설정"
                className="pointer-events-auto flex w-full max-w-[320px] max-h-[min(85dvh,calc(100dvh-2rem))] flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
              >
                <div className="shrink-0 border-b border-slate-800 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200">
                        OpenAI API 키
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                        본인 OpenAI 키를 브라우저에만 저장합니다. AI 한글
                        요약·번역에 사용됩니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="닫기"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-slate-200"
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

                <div className="scroll-area min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
                  {hasApiKey && (
                    <p className="rounded-lg bg-slate-800/80 px-2.5 py-2 text-[11px] text-emerald-300">
                      저장됨: {maskedKey}
                    </p>
                  )}

                  <input
                    type="password"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      setError(null);
                    }}
                    placeholder="sk-..."
                    className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                    autoComplete="off"
                    spellCheck={false}
                  />

                  {error && (
                    <p className="mt-2 text-[11px] text-red-400">{error}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:underline"
                    >
                      키 발급하기
                    </a>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        닫기
                      </button>
                      {hasApiKey && (
                        <button
                          type="button"
                          onClick={() => {
                            onClear();
                            setOpen(false);
                          }}
                          className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          삭제
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-blue-500"
                      >
                        저장
                      </button>
                    </div>
                  </div>
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
        aria-expanded={open}
        className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition sm:py-1.5 ${
          hasApiKey
            ? "border-emerald-700/60 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/50"
            : "border-amber-700/60 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40"
        }`}
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
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
        {hasApiKey ? `API 키 ${maskedKey}` : "OpenAI 키 입력"}
      </button>
      {panel}
    </>
  );
}

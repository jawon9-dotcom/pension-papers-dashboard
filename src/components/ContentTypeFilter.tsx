"use client";

export type ContentType = "all" | "papers" | "news";

interface ContentTypeFilterProps {
  activeType: ContentType;
  onTypeChange: (type: ContentType) => void;
  counts: Record<ContentType, number>;
}

const CONTENT_TYPES: ContentType[] = ["all", "papers", "news"];

const CONTENT_LABELS: Record<ContentType, string> = {
  all: "전체",
  papers: "논문",
  news: "뉴스",
};

export function getContentTypeLabel(type: ContentType): string {
  return CONTENT_LABELS[type];
}

export function ContentTypeFilter({
  activeType,
  onTypeChange,
  counts,
}: ContentTypeFilterProps) {
  return (
    <div className="border-b border-slate-800 px-4 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        콘텐츠 유형
      </p>
      <div className="flex rounded-lg border border-slate-700 bg-slate-800/50 p-0.5">
        {CONTENT_TYPES.map((type) => {
          const active = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={`min-h-9 flex-1 rounded-md px-2 py-2 text-[11px] font-medium transition sm:py-1.5 ${
                active
                  ? type === "news"
                    ? "bg-rose-600 text-white"
                    : type === "papers"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-pressed={active}
            >
              {CONTENT_LABELS[type]}
              <span className="ml-1 opacity-70">({counts[type] ?? 0})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

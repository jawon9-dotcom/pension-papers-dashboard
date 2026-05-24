import { getSourceSiteLabel, formatCitationCount, formatPopularityScore } from "@/lib/source";

interface PaperMetaBadgesProps {
  citationCount?: number;
  popularityScore?: number;
  isNewsArticle?: boolean;
  originalUrl: string;
  sourceSite?: string;
  size?: "sm" | "md";
  showLink?: boolean;
}

export function PaperMetaBadges({
  citationCount,
  popularityScore,
  isNewsArticle,
  originalUrl,
  sourceSite,
  size = "sm",
  showLink = true,
}: PaperMetaBadgesProps) {
  const textSize = size === "md" ? "text-xs" : "text-[10px]";
  const site = sourceSite ?? getSourceSiteLabel(originalUrl);
  const showPopularity = isNewsArticle && (popularityScore ?? 0) > 0;

  return (
    <>
      {showPopularity ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 ${textSize} font-medium text-rose-300`}
          title="뉴스 인기도 (조회·공유 기반 추정)"
        >
          <svg
            className="h-3 w-3 text-rose-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          인기 {formatPopularityScore(popularityScore)}
        </span>
      ) : (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-slate-600/50 bg-slate-800/60 px-2 py-0.5 ${textSize} font-medium text-slate-300`}
          title="인용 건수"
        >
          <svg
            className="h-3 w-3 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          인용 {formatCitationCount(citationCount)}
        </span>
      )}

      {showLink && (
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 ${textSize} font-medium text-blue-300 transition hover:bg-blue-500/20`}
          title={`${site}에서 원문 보기`}
        >
          <svg
            className="h-3 w-3"
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
          {site}
        </a>
      )}
    </>
  );
}

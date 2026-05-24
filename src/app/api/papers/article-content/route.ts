import { NextRequest, NextResponse } from "next/server";
import { fetchArticleContent, isAllowedArticleUrl } from "@/lib/article-content";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
  }

  if (!isAllowedArticleUrl(url)) {
    return NextResponse.json(
      { error: "허용되지 않은 기사 URL입니다." },
      { status: 400 }
    );
  }

  try {
    const result = await fetchArticleContent(url);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Article content fetch failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "기사 원문을 불러오지 못했습니다.",
      },
      { status: 502 }
    );
  }
}

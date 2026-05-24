import { NextRequest, NextResponse } from "next/server";
import { resolveTitleKoBatch, TitleInput } from "@/lib/title-translator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      papers?: TitleInput[];
      openaiApiKey?: string;
    };

    const papers = body.papers ?? [];
    if (papers.length === 0) {
      return NextResponse.json({ titles: {} });
    }

    const titles = await resolveTitleKoBatch(
      papers.slice(0, 50),
      body.openaiApiKey ?? process.env.OPENAI_API_KEY
    );

    return NextResponse.json({ titles });
  } catch (error) {
    console.error("Titles-ko API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "제목 번역 중 오류가 발생했습니다.",
        titles: {},
      },
      { status: 500 }
    );
  }
}

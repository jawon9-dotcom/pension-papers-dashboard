import { NextRequest, NextResponse } from "next/server";
import { getVisitorStats, isValidVisitorId, trackVisitor } from "@/lib/visitor-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getVisitorStats();
    return NextResponse.json({ uniqueCount: stats.uniqueCount });
  } catch (error) {
    console.error("Visitor stats GET error:", error);
    return NextResponse.json({ uniqueCount: 0 }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { visitorId?: string };
    const visitorId = body.visitorId?.trim();

    if (!visitorId || !isValidVisitorId(visitorId)) {
      const stats = await getVisitorStats();
      return NextResponse.json(
        { uniqueCount: stats.uniqueCount, isNew: false },
        { status: 400 }
      );
    }

    const result = await trackVisitor(visitorId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Visitor stats POST error:", error);
    return NextResponse.json(
      { uniqueCount: 0, isNew: false },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { fetchMediaBatch } from "@/lib/anilist";

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)
    .slice(0, 50);

  if (ids.length === 0) {
    return NextResponse.json({ media: [] });
  }

  const media = await fetchMediaBatch(ids);

  return NextResponse.json(
    { media },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
      },
    },
  );
}

import { NextResponse } from "next/server";
import { fetchMediaByIdFull } from "@/lib/anilist";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid AniList ID" }, { status: 400 });
  }

  const media = await fetchMediaByIdFull(id);
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(media, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
  });
}

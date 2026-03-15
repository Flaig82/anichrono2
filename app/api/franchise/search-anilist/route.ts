import { NextResponse } from "next/server";
import { searchMedia } from "@/lib/anilist";

/** GET /api/franchise/search-anilist?q=boruto — search AniList for anime by title */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchMedia(query);

  return NextResponse.json({ results });
}

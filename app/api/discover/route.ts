import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { queryCachedMedia } from "@/lib/anilist-cache";
import type { PosterItem } from "@/components/shared/PosterRow";
import type { AniListDiscoverMedia, DiscoverFilters } from "@/lib/anilist";

function toPosterItems(
  anime: AniListDiscoverMedia[],
  claimedIds: Set<number>,
): PosterItem[] {
  return anime
    .filter((a) => !claimedIds.has(a.id))
    .map((a) => ({
      src: a.coverImageUrl ?? "/images/poster-1.svg",
      alt: a.titleEnglish ?? a.titleRomaji,
      score: a.averageScore,
      anilistId: a.id,
    }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const sort = searchParams.get("sort") ?? undefined;
  const search = searchParams.get("q") ?? undefined;
  const genre = searchParams.get("genre") ?? undefined;
  const format = searchParams.get("format") ?? undefined;
  const season = searchParams.get("season") ?? undefined;
  const year = searchParams.get("year") ?? undefined;

  const filters: DiscoverFilters = {
    sort,
    search,
    genres: genre ? [genre] : undefined,
    season,
    seasonYear: year ? Number(year) : undefined,
    formats: format ? [format] : undefined,
  };

  const supabase = await createClient();

  const [anime, claimedIds] = await Promise.all([
    queryCachedMedia(supabase, filters),
    getClaimedAnilistIds(),
  ]);

  const results = toPosterItems(anime, claimedIds);

  return NextResponse.json({ results, hasMore: false }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
  });
}

async function getClaimedAnilistIds(): Promise<Set<number>> {
  const supabase = await createClient();

  const [{ data: franchises }, { data: entries }] = await Promise.all([
    supabase.from("franchise").select("anilist_id").not("anilist_id", "is", null).limit(5000),
    supabase.from("entry").select("anilist_id").not("anilist_id", "is", null).limit(10000),
  ]);

  const ids = new Set<number>();
  for (const f of franchises ?? []) if (f.anilist_id) ids.add(f.anilist_id);
  for (const e of entries ?? []) if (e.anilist_id) ids.add(e.anilist_id);
  return ids;
}

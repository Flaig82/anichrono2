import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";
import { fetchSeasonalTrending, fetchDiscoverAnime } from "@/lib/anilist";
import type { AniListSeasonalMedia, AniListDiscoverMedia } from "@/lib/anilist";

type Season = "WINTER" | "SPRING" | "SUMMER" | "FALL";

function getCurrentSeason(): { season: Season; year: number; key: string } {
  const month = new Date().getMonth() + 1;
  let season: Season;
  if (month <= 3) season = "WINTER";
  else if (month <= 6) season = "SPRING";
  else if (month <= 9) season = "SUMMER";
  else season = "FALL";
  const year = new Date().getFullYear();
  return { season, year, key: `trending_${season.toLowerCase()}_${year}` };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface CacheRow {
  anilist_id: number;
  title_english: string | null;
  title_romaji: string;
  cover_image_url: string | null;
  average_score: number | null;
  popularity: number | null;
  genres: string[];
  season_year: number | null;
  season: string | null;
  format: string | null;
  episodes: number | null;
  status: string | null;
  related_ids: number[];
  synced_at: string;
}

function seasonalToRow(m: AniListSeasonalMedia, now: string): CacheRow {
  return {
    anilist_id: m.id,
    title_english: m.titleEnglish,
    title_romaji: m.titleRomaji,
    cover_image_url: m.coverImageUrl,
    average_score: m.averageScore,
    popularity: m.popularity,
    genres: m.genres,
    season_year: null,
    season: null,
    format: m.format,
    episodes: m.episodes,
    status: null,
    related_ids: m.relatedIds,
    synced_at: now,
  };
}

function discoverToRow(m: AniListDiscoverMedia, now: string): CacheRow {
  return {
    anilist_id: m.id,
    title_english: m.titleEnglish,
    title_romaji: m.titleRomaji,
    cover_image_url: m.coverImageUrl,
    average_score: m.averageScore,
    popularity: m.popularity,
    genres: m.genres,
    season_year: m.seasonYear,
    season: null,
    format: m.format,
    episodes: null,
    status: null,
    related_ids: [],
    synced_at: now,
  };
}

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends Authorization: Bearer <CRON_SECRET>)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { season, year, key: trendingKey } = getCurrentSeason();
  const now = new Date().toISOString();
  const errors: string[] = [];

  // --- Fetch from AniList sequentially with delays ---

  const trending = await fetchSeasonalTrending(season, year);
  if (trending.length === 0) errors.push("trending returned 0 results");
  await delay(1000);

  const popular = await fetchDiscoverAnime({
    sort: "POPULARITY_DESC",
    popularityGreater: 50000,
  });
  if (popular.length === 0) errors.push("popular returned 0 results");
  await delay(1000);

  const niche = await fetchDiscoverAnime({
    sort: "SCORE_DESC",
    popularityGreater: 10000,
    popularityLesser: 50000,
  });
  if (niche.length === 0) errors.push("niche returned 0 results");
  await delay(1000);

  const hidden = await fetchDiscoverAnime({
    sort: "SCORE_DESC",
    popularityLesser: 10000,
    popularityGreater: 2000,
  });
  if (hidden.length === 0) errors.push("hidden returned 0 results");

  // If ALL fetches failed, don't wipe the cache — keep stale data
  const totalFetched = trending.length + popular.length + niche.length + hidden.length;
  if (totalFetched === 0) {
    console.error("AniList sync: all fetches returned empty, keeping stale cache");
    return NextResponse.json(
      { error: "All AniList fetches failed", details: errors },
      { status: 502 },
    );
  }

  // --- Upsert media into cache ---

  const allRows: CacheRow[] = [];
  const seen = new Set<number>();

  for (const m of trending) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      allRows.push(seasonalToRow(m, now));
    }
  }
  for (const list of [popular, niche, hidden]) {
    for (const m of list) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        allRows.push(discoverToRow(m, now));
      }
    }
  }

  const { error: upsertError } = await supabase
    .from("anilist_media_cache")
    .upsert(allRows, { onConflict: "anilist_id" });

  if (upsertError) {
    console.error("AniList cache upsert error:", upsertError);
    return NextResponse.json(
      { error: "Cache upsert failed", details: upsertError.message },
      { status: 500 },
    );
  }

  // --- Update discover lists ---

  const lists = [
    { list_key: trendingKey, anilist_ids: trending.map((m) => m.id), synced_at: now },
    { list_key: "popular", anilist_ids: popular.map((m) => m.id), synced_at: now },
    { list_key: "niche", anilist_ids: niche.map((m) => m.id), synced_at: now },
    { list_key: "hidden", anilist_ids: hidden.map((m) => m.id), synced_at: now },
  ];

  const { error: listError } = await supabase
    .from("anilist_discover_list")
    .upsert(lists, { onConflict: "list_key" });

  if (listError) {
    console.error("Discover list upsert error:", listError);
    return NextResponse.json(
      { error: "List upsert failed", details: listError.message },
      { status: 500 },
    );
  }

  const result = {
    synced: allRows.length,
    trending: trending.length,
    popular: popular.length,
    niche: niche.length,
    hidden: hidden.length,
    warnings: errors.length > 0 ? errors : undefined,
  };

  console.log("AniList sync complete:", result);
  return NextResponse.json(result);
}

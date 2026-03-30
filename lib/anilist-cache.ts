import type { SupabaseClient } from "@supabase/supabase-js";
import type { AniListSeasonalMedia, AniListDiscoverMedia, DiscoverFilters } from "@/lib/anilist";

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
}

/**
 * Read cached seasonal trending anime from Supabase.
 * Returns the same AniListSeasonalMedia[] shape so page code stays unchanged.
 */
export async function getCachedTrending(
  supabase: SupabaseClient,
  season: string,
  year: number,
): Promise<AniListSeasonalMedia[]> {
  const listKey = `trending_${season.toLowerCase()}_${year}`;

  const { data: list } = await supabase
    .from("anilist_discover_list")
    .select("anilist_ids")
    .eq("list_key", listKey)
    .single();

  if (!list?.anilist_ids?.length) return [];

  const { data: rows } = await supabase
    .from("anilist_media_cache")
    .select("*")
    .in("anilist_id", list.anilist_ids);

  if (!rows?.length) return [];

  // Preserve the original order from the discover list
  const byId = new Map<number, CacheRow>();
  for (const row of rows as CacheRow[]) {
    byId.set(row.anilist_id, row);
  }

  return (list.anilist_ids as number[])
    .map((id) => byId.get(id))
    .filter((row): row is CacheRow => row != null)
    .map((row) => ({
      id: row.anilist_id,
      titleEnglish: row.title_english,
      titleRomaji: row.title_romaji,
      coverImageUrl: row.cover_image_url,
      averageScore: row.average_score,
      popularity: row.popularity,
      episodes: row.episodes,
      format: row.format,
      genres: row.genres ?? [],
      relatedIds: row.related_ids ?? [],
    }));
}

/**
 * Read a cached discover list (popular, niche, hidden) from Supabase.
 * Returns the same AniListDiscoverMedia[] shape so page code stays unchanged.
 */
export async function getCachedDiscoverList(
  supabase: SupabaseClient,
  listKey: string,
): Promise<AniListDiscoverMedia[]> {
  const { data: list } = await supabase
    .from("anilist_discover_list")
    .select("anilist_ids")
    .eq("list_key", listKey)
    .single();

  if (!list?.anilist_ids?.length) return [];

  const { data: rows } = await supabase
    .from("anilist_media_cache")
    .select("*")
    .in("anilist_id", list.anilist_ids);

  if (!rows?.length) return [];

  const byId = new Map<number, CacheRow>();
  for (const row of rows as CacheRow[]) {
    byId.set(row.anilist_id, row);
  }

  return (list.anilist_ids as number[])
    .map((id) => byId.get(id))
    .filter((row): row is CacheRow => row != null)
    .map((row) => ({
      id: row.anilist_id,
      titleEnglish: row.title_english,
      titleRomaji: row.title_romaji,
      coverImageUrl: row.cover_image_url,
      averageScore: row.average_score,
      popularity: row.popularity,
      genres: row.genres ?? [],
      seasonYear: row.season_year,
      format: row.format,
    }));
}

/**
 * Query the cache with filters (genre, format, season, search, sort).
 * Results are limited to what's in the cache (~60 anime), but enough for a functional filtered view.
 */
export async function queryCachedMedia(
  supabase: SupabaseClient,
  filters: DiscoverFilters,
): Promise<AniListDiscoverMedia[]> {
  let query = supabase
    .from("anilist_media_cache")
    .select("*");

  if (filters.genres?.length) {
    // Postgres array overlap: at least one genre matches
    query = query.overlaps("genres", filters.genres);
  }
  if (filters.formats?.length) {
    query = query.in("format", filters.formats);
  }
  if (filters.season) {
    query = query.eq("season", filters.season);
  }
  if (filters.seasonYear) {
    query = query.eq("season_year", filters.seasonYear);
  }
  if (filters.search) {
    // Case-insensitive search on both title fields
    const term = `%${filters.search}%`;
    query = query.or(`title_english.ilike.${term},title_romaji.ilike.${term}`);
  }
  if (filters.popularityGreater) {
    query = query.gt("popularity", filters.popularityGreater);
  }
  if (filters.popularityLesser) {
    query = query.lt("popularity", filters.popularityLesser);
  }

  // Sort
  const sort = filters.sort ?? "POPULARITY_DESC";
  if (sort === "SCORE_DESC") {
    query = query.order("average_score", { ascending: false, nullsFirst: false });
  } else if (sort === "TRENDING_DESC" || sort === "POPULARITY_DESC") {
    query = query.order("popularity", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("popularity", { ascending: false, nullsFirst: false });
  }

  query = query.limit(18);

  const { data: rows } = await query;
  if (!rows?.length) return [];

  return (rows as CacheRow[]).map((row) => ({
    id: row.anilist_id,
    titleEnglish: row.title_english,
    titleRomaji: row.title_romaji,
    coverImageUrl: row.cover_image_url,
    averageScore: row.average_score,
    popularity: row.popularity,
    genres: row.genres ?? [],
    seasonYear: row.season_year,
    format: row.format,
  }));
}

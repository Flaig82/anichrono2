import type { SupabaseClient } from "@supabase/supabase-js";
import { queryCachedMedia } from "@/lib/anilist-cache";
import { searchMedia } from "@/lib/anilist";
import { getClaimedAnilistIds } from "@/lib/claimed-anime";
import type { PosterItem } from "@/components/shared/PosterRow";

const FALLBACK_POSTER = "/images/poster-1.svg";

/**
 * Live AniList search → unclaimed PosterItems.
 *
 * Used as the fallback when the local cache has no usable match. Live search
 * has no averageScore, so posters render without a score badge. On any AniList
 * error, searchMedia returns [] — i.e. the same empty state as before.
 */
export async function liveSearchPosters(
  query: string,
  claimedIds: Set<number>,
  limit = 12,
): Promise<PosterItem[]> {
  const live = await searchMedia(query);
  return live
    .filter((a) => !claimedIds.has(a.id))
    .slice(0, limit)
    .map((a) => ({
      src: a.coverImageUrl ?? FALLBACK_POSTER,
      alt: a.titleEnglish ?? a.titleRomaji,
      score: null,
      anilistId: a.id,
    }));
}

/**
 * Search for unclaimed anime as PosterItems: cache-first, live AniList fallback.
 *
 * The cache only holds the ~66 Discover-list titles, so obscure searches miss
 * it entirely. When the cache yields no usable (unclaimed) results, fall through
 * to a live AniList search. This is low-volume, user-initiated traffic, so it
 * stays within AniList's tolerances while killing the "no results" dead end.
 */
export async function searchAnimePosters(
  supabase: SupabaseClient,
  query: string,
  limit = 12,
): Promise<PosterItem[]> {
  if (!query.trim()) return [];

  const [cached, claimedIds] = await Promise.all([
    queryCachedMedia(supabase, { search: query }),
    getClaimedAnilistIds(supabase),
  ]);

  const cachedPosters: PosterItem[] = cached
    .filter((a) => !claimedIds.has(a.id))
    .slice(0, limit)
    .map((a) => ({
      src: a.coverImageUrl ?? FALLBACK_POSTER,
      alt: a.titleEnglish ?? a.titleRomaji,
      score: a.averageScore,
      anilistId: a.id,
    }));

  if (cachedPosters.length > 0) return cachedPosters;

  return liveSearchPosters(query, claimedIds, limit);
}

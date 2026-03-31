import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Set of AniList IDs that are already claimed by a franchise or entry.
 * Used to filter them out of discover/search results.
 */
export async function getClaimedAnilistIds(
  supabase: SupabaseClient,
): Promise<Set<number>> {
  const [{ data: franchises }, { data: entries }] = await Promise.all([
    supabase.from("franchise").select("anilist_id").not("anilist_id", "is", null).limit(5000),
    supabase.from("entry").select("anilist_id").not("anilist_id", "is", null).limit(10000),
  ]);

  const ids = new Set<number>();
  for (const f of franchises ?? []) if (f.anilist_id) ids.add(f.anilist_id);
  for (const e of entries ?? []) if (e.anilist_id) ids.add(e.anilist_id);
  return ids;
}

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

/**
 * For a batch of AniList ids, return which are already on a LIVE franchise and
 * the franchise's slug/title — so a typeahead can show a "View" link.
 *
 * Batch version of findMatchingFranchise() (app/franchise/create/page.tsx):
 * franchise.anilist_id is the stronger signal, then entry.anilist_id. Pass the
 * anon-respecting client — RLS hides draft/rejected franchises, so a drafted
 * anime correctly resolves to absent (→ the caller shows "Create").
 */
export async function resolveOnSiteSlugs(
  supabase: SupabaseClient,
  anilistIds: number[],
): Promise<Map<number, { slug: string; title: string }>> {
  const map = new Map<number, { slug: string; title: string }>();
  if (anilistIds.length === 0) return map;

  // 1. Direct franchise matches (strongest signal).
  const { data: franchises } = await supabase
    .from("franchise")
    .select("anilist_id, slug, title")
    .in("anilist_id", anilistIds);
  for (const f of franchises ?? []) {
    if (f.anilist_id) map.set(f.anilist_id, { slug: f.slug, title: f.title });
  }

  // 2. Entry matches for ids not already resolved → look up their franchise.
  const unresolved = anilistIds.filter((id) => !map.has(id));
  if (unresolved.length > 0) {
    const { data: entries } = await supabase
      .from("entry")
      .select("anilist_id, franchise_id")
      .in("anilist_id", unresolved)
      .neq("is_removed", true);

    const entryByFranchise = new Map<string, number[]>();
    for (const e of entries ?? []) {
      if (!e.anilist_id || !e.franchise_id) continue;
      const list = entryByFranchise.get(e.franchise_id) ?? [];
      list.push(e.anilist_id);
      entryByFranchise.set(e.franchise_id, list);
    }

    if (entryByFranchise.size > 0) {
      const { data: parents } = await supabase
        .from("franchise")
        .select("id, slug, title")
        .in("id", [...entryByFranchise.keys()]);
      for (const p of parents ?? []) {
        for (const anilistId of entryByFranchise.get(p.id) ?? []) {
          if (!map.has(anilistId)) map.set(anilistId, { slug: p.slug, title: p.title });
        }
      }
    }
  }

  return map;
}

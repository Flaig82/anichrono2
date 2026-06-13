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

interface SearchResultRef {
  id: number;
  titleEnglish: string | null;
  titleRomaji: string;
}

/**
 * For a batch of AniList search results, return which are already on a LIVE
 * franchise and that franchise's slug/title — so a typeahead can show "View".
 *
 * Detection runs in layers, because a season can live on the site in several
 * shapes (franchise model = one master order per franchise, with related
 * series folded in as parent_series-grouped episode blocks):
 *   1. franchise.anilist_id   (the flagship)
 *   2. entry.anilist_id       (a related work seeded as its own entry)
 *   3. franchise.title        (title match — flagship id differs from search)
 *   4. entry.parent_series    (e.g. "Dragon Ball Z" episodes split into blocks
 *                              with NULL anilist_id, grouped under that header)
 * Layers 3-4 match on a normalized title, so e.g. "Dragon Ball Z" resolves to
 * the Dragon Ball franchise instead of offering a duplicate "Create".
 *
 * Pass the anon-respecting client — RLS hides draft/rejected franchises, so a
 * drafted anime correctly resolves to absent (→ the caller shows "Create").
 */
export async function resolveOnSiteSlugs(
  supabase: SupabaseClient,
  results: SearchResultRef[],
): Promise<Map<number, { slug: string; title: string }>> {
  const map = new Map<number, { slug: string; title: string }>();
  if (results.length === 0) return map;
  const ids = results.map((r) => r.id);

  // --- Layer 1: direct franchise.anilist_id match -------------------------
  const { data: franchises } = await supabase
    .from("franchise")
    .select("anilist_id, slug, title")
    .in("anilist_id", ids);
  for (const f of franchises ?? []) {
    if (f.anilist_id) map.set(f.anilist_id, { slug: f.slug, title: f.title });
  }

  // --- Layer 2: entry.anilist_id match → its franchise --------------------
  let unresolvedIds = ids.filter((id) => !map.has(id));
  if (unresolvedIds.length > 0) {
    const { data: entries } = await supabase
      .from("entry")
      .select("anilist_id, franchise_id")
      .in("anilist_id", unresolvedIds)
      .neq("is_removed", true);

    const byFranchise = new Map<string, number[]>();
    for (const e of entries ?? []) {
      if (!e.anilist_id || !e.franchise_id) continue;
      (byFranchise.get(e.franchise_id) ?? byFranchise.set(e.franchise_id, []).get(e.franchise_id)!).push(e.anilist_id);
    }
    if (byFranchise.size > 0) {
      const { data: parents } = await supabase
        .from("franchise")
        .select("id, slug, title")
        .in("id", [...byFranchise.keys()]);
      for (const p of parents ?? []) {
        for (const anilistId of byFranchise.get(p.id) ?? []) {
          if (!map.has(anilistId)) map.set(anilistId, { slug: p.slug, title: p.title });
        }
      }
    }
  }

  // --- Layers 3-4: title / parent_series match ----------------------------
  // Catches seasons that share NO anilist_id with the site (hand-curated
  // episode blocks), e.g. "Dragon Ball Z" under the Dragon Ball franchise.
  unresolvedIds = ids.filter((id) => !map.has(id));
  if (unresolvedIds.length > 0) {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
    const unresolved = results.filter((r) => !map.has(r.id));

    // normalized title → result ids; and the raw title strings (for the scoped
    // parent_series IN query, which can't normalize in SQL).
    const normToIds = new Map<string, number[]>();
    const rawTitles = new Set<string>();
    for (const r of unresolved) {
      for (const t of [r.titleEnglish, r.titleRomaji]) {
        if (!t) continue;
        rawTitles.add(t);
        const k = norm(t);
        if (k) (normToIds.get(k) ?? normToIds.set(k, []).get(k)!).push(r.id);
      }
    }

    const assign = (normKey: string, slug: string, title: string) => {
      for (const id of normToIds.get(normKey) ?? []) {
        if (!map.has(id)) map.set(id, { slug, title });
      }
    };

    // Layer 3 — franchise.title (normalized). ~hundreds of live franchises, cheap.
    // Layer 4 — entry.parent_series, scoped to the candidate raw titles (exact
    // match; covers the common "Dragon Ball Z"-style season headers).
    const [{ data: allFranchises }, { data: groupedEntries }] = await Promise.all([
      supabase.from("franchise").select("slug, title"),
      supabase
        .from("entry")
        .select("parent_series, franchise_id")
        .in("parent_series", [...rawTitles])
        .neq("is_removed", true),
    ]);

    for (const f of allFranchises ?? []) assign(norm(f.title), f.slug, f.title);

    if (groupedEntries?.length) {
      const { data: idKeyed } = await supabase
        .from("franchise")
        .select("id, slug, title")
        .in("id", [...new Set(groupedEntries.map((e) => e.franchise_id).filter(Boolean))]);
      const byId = new Map((idKeyed ?? []).map((f) => [f.id, { slug: f.slug, title: f.title }]));
      for (const e of groupedEntries) {
        const fr = e.franchise_id ? byId.get(e.franchise_id) : undefined;
        if (fr && e.parent_series) assign(norm(e.parent_series), fr.slug, fr.title);
      }
    }
  }

  return map;
}

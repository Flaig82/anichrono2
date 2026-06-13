import { NextResponse } from "next/server";
import { searchMedia } from "@/lib/anilist";
import { createClient } from "@/lib/supabase-server";
import { resolveOnSiteSlugs } from "@/lib/claimed-anime";

/**
 * GET /api/search/typeahead?q=naruto — nav typeahead.
 *
 * Live-searches AniList, then tags each result with whether it's already a live
 * franchise on the site (→ "View") or not (→ "Create").
 *
 * NOT shared-cached: the `onSite` field is DB-derived and flips when a draft is
 * approved, so a `public, s-maxage` cache would serve stale View/Create buttons.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchMedia(query);

  const supabase = await createClient();
  const onSiteMap = await resolveOnSiteSlugs(supabase, results);

  const tagged = results.map((r) => ({
    ...r,
    onSite: onSiteMap.get(r.id) ?? null,
  }));

  return NextResponse.json(
    { results: tagged },
    { headers: { "Cache-Control": "private, max-age=0" } },
  );
}

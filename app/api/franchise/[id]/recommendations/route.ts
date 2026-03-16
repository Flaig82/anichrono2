import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchRecommendations } from "@/lib/anilist";

/** GET /api/franchise/[id]/recommendations — AniList recommendations for a franchise */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const { data: franchise, error } = await supabase
    .from("franchise")
    .select("anilist_id")
    .eq("id", params.id)
    .single();

  if (error || !franchise) {
    return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
  }

  if (!franchise.anilist_id) {
    return NextResponse.json({ recommendations: [] });
  }

  const recommendations = await fetchRecommendations(franchise.anilist_id);

  // Cross-reference with our franchise table to link to internal pages
  const anilistIds = recommendations.map((r) => r.id);
  const { data: localFranchises } = await supabase
    .from("franchise")
    .select("anilist_id, slug, title, cover_image_url")
    .in("anilist_id", anilistIds);

  const localMap = new Map(
    (localFranchises ?? []).map((f) => [f.anilist_id, f]),
  );

  const enriched = recommendations
    .filter((r) => localMap.has(r.id))
    .map((r) => {
      const local = localMap.get(r.id)!;
      return {
        ...r,
        slug: local.slug,
        localTitle: local.title,
        localCoverUrl: local.cover_image_url,
      };
    });

  return NextResponse.json({ recommendations: enriched });
}

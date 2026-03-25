import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchMediaRelations } from "@/lib/anilist";

/** GET /api/franchise/[id]/relations — fetch AniList relations for a franchise */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const franchiseId = (await params).id;

  // Look up the franchise's anilist_id
  const { data: franchise, error } = await supabase
    .from("franchise")
    .select("anilist_id")
    .eq("id", franchiseId)
    .single();

  if (error || !franchise) {
    return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
  }

  if (!franchise.anilist_id) {
    return NextResponse.json({ relations: [] });
  }

  const relations = await fetchMediaRelations(franchise.anilist_id);

  return NextResponse.json({ relations }, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
  });
}

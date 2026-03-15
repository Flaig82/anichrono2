import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/franchise/[id]/entries — fetch entries for a franchise */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const { data: entries, error } = await supabase
    .from("entry")
    .select(
      "id, franchise_id, title, entry_type, episode_start, episode_end, position, parent_series, anilist_id, is_essential, curator_note, cover_image_url",
    )
    .eq("franchise_id", params.id)
    .eq("is_removed", false)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(entries ?? []);
}

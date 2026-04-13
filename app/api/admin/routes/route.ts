import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/admin/routes — fetch all in_review routes for admin review */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: routes, error } = await supabase
    .from("route")
    .select(
      `
      id,
      franchise_id,
      author_id,
      title,
      route_type,
      entry_ids,
      summary,
      status,
      vote_count,
      follower_count,
      is_canon,
      created_at,
      updated_at,
      franchise:franchise_id (id, title, slug, cover_image_url),
      author:author_id (display_name, handle, avatar_url, era)
    `,
    )
    .in("status", ["in_review"])
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with master entry counts for diff summary
  const franchiseIds = [
    ...new Set((routes ?? []).map((r: { franchise_id: string }) => r.franchise_id)),
  ];
  const masterCounts: Record<string, number> = {};
  if (franchiseIds.length > 0) {
    for (const fId of franchiseIds) {
      const { count } = await supabase
        .from("entry")
        .select("id", { count: "exact", head: true })
        .eq("franchise_id", fId)
        .eq("is_removed", false);
      masterCounts[fId] = count ?? 0;
    }
  }

  const enriched = (routes ?? []).map(
    (r: { franchise_id: string; entry_ids: string[] }) => ({
      ...r,
      master_entry_count: masterCounts[r.franchise_id] ?? 0,
    }),
  );

  return NextResponse.json(enriched);
}

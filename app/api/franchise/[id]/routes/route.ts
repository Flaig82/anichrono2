import { createClient } from "@/lib/supabase-server";
import { computeStaleness } from "@/lib/route-staleness";
import { NextResponse } from "next/server";

/**
 * GET /api/franchise/[id]/routes — list approved routes for a franchise,
 * ordered by canonicality then vote_count.
 *
 * Canonical routes appear first (is_canon desc), then by popularity. This
 * is what powers the RouteList on the franchise page.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const franchiseId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: routes, error } = await supabase
    .from("route")
    .select(
      "id, franchise_id, author_id, title, route_type, entry_ids, summary, status, vote_count, follower_count, is_canon, created_at, updated_at, author:users!author_id(display_name, handle, avatar_url, era)",
    )
    .eq("franchise_id", franchiseId)
    .in("status", ["approved", "canon"])
    .order("is_canon", { ascending: false })
    .order("vote_count", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If the user is logged in, hydrate their vote + follow state in one pass
  const userVotes: Record<string, number> = {};
  const userFollows: Set<string> = new Set();

  if (user && routes && routes.length > 0) {
    const routeIds = routes.map((r: { id: string }) => r.id);
    const [{ data: votes }, { data: follows }] = await Promise.all([
      supabase
        .from("route_vote")
        .select("route_id, value")
        .eq("user_id", user.id)
        .in("route_id", routeIds),
      supabase
        .from("route_follow")
        .select("route_id")
        .eq("user_id", user.id)
        .in("route_id", routeIds),
    ]);
    for (const v of votes ?? []) {
      userVotes[v.route_id] = v.value;
    }
    for (const f of follows ?? []) {
      userFollows.add(f.route_id);
    }
  }

  // Fetch master entry IDs once for staleness calculation across all routes
  const { data: masterEntries } = await supabase
    .from("entry")
    .select("id")
    .eq("franchise_id", franchiseId)
    .eq("is_removed", false)
    .order("position", { ascending: true });

  const masterIds = (masterEntries ?? []).map((e) => e.id);

  const enriched = (routes ?? []).map(
    (r: { id: string; entry_ids: string[] }) => ({
      ...r,
      user_vote: userVotes[r.id] ?? null,
      is_followed: userFollows.has(r.id),
      staleness: computeStaleness(r.entry_ids, masterIds),
    }),
  );

  return NextResponse.json(enriched, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
  });
}

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/activity/live — 15 most recent user actions for the live feed */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .select(
      "id, user_id, type, created_at, metadata, user:users!user_id(display_name, handle, avatar_url), franchise:franchise!franchise_id(title, slug), entry:entry!entry_id(title)",
    )
    .in("type", ["complete_entry", "start_watching", "review", "rate", "drop", "add_to_watchlist"])
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = data ?? [];
  if (items.length === 0) {
    return NextResponse.json([]);
  }

  // Get current user (may be null for logged-out visitors)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const itemIds = items.map((item) => item.id);

  // Batch-fetch like counts
  const { data: likeCounts } = await supabase
    .from("activity_like")
    .select("item_id")
    .eq("item_type", "activity")
    .in("item_id", itemIds);

  const countMap = new Map<string, number>();
  for (const row of likeCounts ?? []) {
    countMap.set(row.item_id, (countMap.get(row.item_id) ?? 0) + 1);
  }

  // Batch-fetch current user's likes
  const userLikedSet = new Set<string>();
  if (user) {
    const { data: userLikes } = await supabase
      .from("activity_like")
      .select("item_id")
      .eq("item_type", "activity")
      .eq("user_id", user.id)
      .in("item_id", itemIds);

    for (const row of userLikes ?? []) {
      userLikedSet.add(row.item_id);
    }
  }

  // Attach like data to each item
  const enriched = items.map((item) => ({
    ...item,
    like_count: countMap.get(item.id) ?? 0,
    user_liked: userLikedSet.has(item.id),
  }));

  return NextResponse.json(enriched, {
    headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=10" },
  });
}

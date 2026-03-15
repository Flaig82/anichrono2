import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { PublicProfile } from "@/types/user";
import type { AuraType } from "@/types/aura";

interface AuraRow {
  aura_type: AuraType;
  value: number;
}

/** GET /api/user/[handle] — public profile */
export async function GET(
  _request: Request,
  { params }: { params: { handle: string } },
) {
  const supabase = createClient();
  const { handle } = params;

  const selectCols =
    "id, display_name, handle, avatar_url, era, dominant_aura_type, total_aura, bio, is_watchlist_public, created_at";

  // Try handle first, fall back to ID lookup (UUIDs contain hyphens, handles allow them too,
  // so we attempt handle match first since that's the canonical URL form)
  let { data: user, error } = await supabase
    .from("users")
    .select(selectCols)
    .eq("handle", handle)
    .single();

  if (error || !user) {
    // Fallback: try by ID
    const idResult = await supabase
      .from("users")
      .select(selectCols)
      .eq("id", handle)
      .single();
    user = idResult.data;
    error = idResult.error;
  }

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile: PublicProfile = {
    id: user.id,
    display_name: user.display_name,
    handle: user.handle,
    avatar_url: user.avatar_url,
    era: user.era,
    dominant_aura_type: user.dominant_aura_type,
    total_aura: user.total_aura,
    bio: user.bio ?? "",
    is_watchlist_public: user.is_watchlist_public ?? true,
    created_at: user.created_at,
  };

  // Fetch aura breakdown
  const { data: auraRows } = await supabase
    .from("user_aura")
    .select("aura_type, value")
    .eq("user_id", user.id)
    .order("value", { ascending: false });

  // Watch stats
  const { count: completedCount } = await supabase
    .from("watch_entry")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const { count: watchingCount } = await supabase
    .from("watch_entry")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "watching");

  const { count: droppedCount } = await supabase
    .from("watch_entry")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "dropped");

  // Review count
  const { count: reviewCount } = await supabase
    .from("review")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Recent activity
  const { data: activity } = await supabase
    .from("activity")
    .select(
      "id, type, created_at, metadata, franchise_id, entry_id, franchise:franchise_id(title, slug), entry:entry_id(title)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    profile,
    aura: (auraRows ?? []) as AuraRow[],
    stats: {
      completed: completedCount ?? 0,
      watching: watchingCount ?? 0,
      dropped: droppedCount ?? 0,
      reviews: reviewCount ?? 0,
    },
    activity: activity ?? [],
  });
}

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/franchise/[id]/activity — pending + recent proposals for sidebar */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const franchiseId = (await params).id;

  // Fetch open + pending_approval proposals (pending updates)
  const { data: pending } = await supabase
    .from("order_proposal")
    .select(
      "id, author_id, title, description, vote_score, status, created_at, author:users!author_id(display_name, handle, avatar_url)",
    )
    .eq("franchise_id", franchiseId)
    .in("status", ["open", "pending_approval"])
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch recently applied proposals (recent updates)
  const { data: recent } = await supabase
    .from("order_proposal")
    .select(
      "id, author_id, title, description, vote_score, applied_at, created_at, author:users!author_id(display_name, handle, avatar_url)",
    )
    .eq("franchise_id", franchiseId)
    .eq("status", "applied")
    .order("applied_at", { ascending: false })
    .limit(5);

  // Collect all proposal IDs for like data
  const allProposals = [...(pending ?? []), ...(recent ?? [])];
  const proposalIds = allProposals.map((p) => p.id);

  // Default like values
  const countMap = new Map<string, number>();
  const userLikedSet = new Set<string>();

  if (proposalIds.length > 0) {
    // Batch-fetch like counts
    const { data: likes } = await supabase
      .from("activity_like")
      .select("item_id")
      .eq("item_type", "proposal")
      .in("item_id", proposalIds);

    for (const row of likes ?? []) {
      countMap.set(row.item_id, (countMap.get(row.item_id) ?? 0) + 1);
    }

    // Current user's likes
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: userLikes } = await supabase
        .from("activity_like")
        .select("item_id")
        .eq("item_type", "proposal")
        .eq("user_id", user.id)
        .in("item_id", proposalIds);

      for (const row of userLikes ?? []) {
        userLikedSet.add(row.item_id);
      }
    }
  }

  const attachLikes = <T extends { id: string }>(items: T[]) =>
    items.map((item) => ({
      ...item,
      like_count: countMap.get(item.id) ?? 0,
      user_liked: userLikedSet.has(item.id),
    }));

  return NextResponse.json({
    pending: attachLikes(pending ?? []),
    recent: attachLikes(recent ?? []),
  });
}

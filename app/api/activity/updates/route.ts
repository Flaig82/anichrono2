import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import type { ContentUpdateItem } from "@/types/activity";

/** GET /api/activity/updates — applied proposals + recently added franchises */
export async function GET() {
  const supabase = await createClient();

  // Recently applied proposals
  const { data: proposals } = await supabase
    .from("order_proposal")
    .select(
      "id, title, description, applied_at, franchise:franchise!franchise_id(title, slug, cover_image_url)",
    )
    .eq("status", "applied")
    .not("applied_at", "is", null)
    .order("applied_at", { ascending: false })
    .limit(10);

  // Recently added franchises
  const { data: franchises } = await supabase
    .from("franchise")
    .select("id, title, slug, cover_image_url, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  // Normalize into a single sorted array
  const items: ContentUpdateItem[] = [];

  if (proposals) {
    for (const p of proposals) {
      const fRaw = p.franchise as unknown;
      const f = Array.isArray(fRaw) ? fRaw[0] as { title: string; slug: string; cover_image_url: string | null } | undefined : fRaw as { title: string; slug: string; cover_image_url: string | null } | null;
      items.push({
        id: p.id,
        kind: "proposal_applied",
        title: f?.title ?? "Unknown Franchise",
        description: p.title,
        poster: f?.cover_image_url ?? null,
        created_at: p.applied_at!,
        like_count: 0,
        user_liked: false,
      });
    }
  }

  if (franchises) {
    for (const f of franchises) {
      items.push({
        id: f.id,
        kind: "new_franchise",
        title: f.title,
        description: "Added to franchise database",
        poster: f.cover_image_url ?? null,
        created_at: f.created_at,
        like_count: 0,
        user_liked: false,
      });
    }
  }

  // Sort descending by date, take top 10
  items.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const sliced = items.slice(0, 10);

  if (sliced.length === 0) {
    return NextResponse.json([]);
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Build like item IDs with their types
  const proposalIds = sliced.filter((i) => i.kind === "proposal_applied").map((i) => i.id);
  const franchiseIds = sliced.filter((i) => i.kind === "new_franchise").map((i) => i.id);

  // Batch-fetch like counts for proposals
  const countMap = new Map<string, number>();

  if (proposalIds.length > 0) {
    const { data: proposalLikes } = await supabase
      .from("activity_like")
      .select("item_id")
      .eq("item_type", "proposal")
      .in("item_id", proposalIds);

    for (const row of proposalLikes ?? []) {
      countMap.set(row.item_id, (countMap.get(row.item_id) ?? 0) + 1);
    }
  }

  if (franchiseIds.length > 0) {
    const { data: franchiseLikes } = await supabase
      .from("activity_like")
      .select("item_id")
      .eq("item_type", "franchise")
      .in("item_id", franchiseIds);

    for (const row of franchiseLikes ?? []) {
      countMap.set(row.item_id, (countMap.get(row.item_id) ?? 0) + 1);
    }
  }

  // Batch-fetch current user's likes
  const userLikedSet = new Set<string>();
  if (user) {
    if (proposalIds.length > 0) {
      const { data: userPLikes } = await supabase
        .from("activity_like")
        .select("item_id")
        .eq("item_type", "proposal")
        .eq("user_id", user.id)
        .in("item_id", proposalIds);

      for (const row of userPLikes ?? []) {
        userLikedSet.add(row.item_id);
      }
    }

    if (franchiseIds.length > 0) {
      const { data: userFLikes } = await supabase
        .from("activity_like")
        .select("item_id")
        .eq("item_type", "franchise")
        .eq("user_id", user.id)
        .in("item_id", franchiseIds);

      for (const row of userFLikes ?? []) {
        userLikedSet.add(row.item_id);
      }
    }
  }

  // Attach like data
  const enriched = sliced.map((item) => ({
    ...item,
    like_count: countMap.get(item.id) ?? 0,
    user_liked: userLikedSet.has(item.id),
  }));

  return NextResponse.json(enriched, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=30" },
  });
}

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { watchlistQuerySchema } from "@/lib/validations/watchlist";
import type { FranchiseWatchStatus, WatchlistItem } from "@/types/watchlist";

/** GET /api/user/[handle]/watchlist — user's franchise-level watchlist with progress */
export async function GET(
  request: Request,
  { params }: { params: { handle: string } },
) {
  const supabase = createClient();
  const { handle } = params;

  // Look up user by handle, fall back to ID
  let { data: targetUser } = await supabase
    .from("users")
    .select("id, is_watchlist_public")
    .eq("handle", handle)
    .single();

  if (!targetUser) {
    const idResult = await supabase
      .from("users")
      .select("id, is_watchlist_public")
      .eq("id", handle)
      .single();
    targetUser = idResult.data;
  }

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check privacy
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();
  const isOwnProfile = currentUser?.id === targetUser.id;

  if (!targetUser.is_watchlist_public && !isOwnProfile) {
    return NextResponse.json(
      { error: "This user's watchlist is private" },
      { status: 403 },
    );
  }

  // Parse query params
  const url = new URL(request.url);
  const parsed = watchlistQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { status, sort, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  // Query franchise_watchlist with franchise metadata
  let query = supabase
    .from("franchise_watchlist")
    .select(
      "id, franchise_id, status, added_at, updated_at, franchise:franchise_id(id, title, slug, cover_image_url, banner_image_url, genres, year_started, studio, status)",
      { count: "exact" },
    )
    .eq("user_id", targetUser.id);

  // Filter by status
  if (status !== "all") {
    query = query.eq("status", status);
  }

  // Sort
  switch (sort) {
    case "title":
      // Supabase doesn't support ordering by joined column, sort client-side later
      query = query.order("added_at", { ascending: false });
      break;
    case "progress":
      // Will sort client-side after computing progress
      query = query.order("added_at", { ascending: false });
      break;
    case "recent":
    default:
      query = query.order("updated_at", { ascending: false });
      break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data: rows, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({
      items: [],
      total: count ?? 0,
      page,
      hasMore: false,
    });
  }

  // Get franchise IDs to compute progress
  const franchiseIds = rows.map((r) => r.franchise_id);

  // Count total entries per franchise
  const { data: entryCounts } = await supabase
    .from("entry")
    .select("franchise_id")
    .in("franchise_id", franchiseIds)
    .eq("is_removed", false);

  const totalByFranchise: Record<string, number> = {};
  for (const row of entryCounts ?? []) {
    totalByFranchise[row.franchise_id] = (totalByFranchise[row.franchise_id] ?? 0) + 1;
  }

  // Count completed watch_entry rows per franchise for this user
  const { data: completedCounts } = await supabase
    .from("watch_entry")
    .select("franchise_id")
    .eq("user_id", targetUser.id)
    .in("franchise_id", franchiseIds)
    .eq("status", "completed");

  const completedByFranchise: Record<string, number> = {};
  for (const row of completedCounts ?? []) {
    completedByFranchise[row.franchise_id] = (completedByFranchise[row.franchise_id] ?? 0) + 1;
  }

  // Build response items
  const items: WatchlistItem[] = rows.map((row) => {
    const entriesTotal = totalByFranchise[row.franchise_id] ?? 0;
    const entriesCompleted = completedByFranchise[row.franchise_id] ?? 0;
    const progress = entriesTotal > 0 ? entriesCompleted / entriesTotal : 0;

    // Supabase returns the joined franchise as an object (or array with single element)
    const franchise = Array.isArray(row.franchise) ? row.franchise[0] : row.franchise;

    return {
      id: row.id,
      franchise_id: row.franchise_id,
      status: row.status as FranchiseWatchStatus,
      added_at: row.added_at,
      updated_at: row.updated_at,
      entries_completed: entriesCompleted,
      entries_total: entriesTotal,
      progress,
      franchise: franchise ?? {
        id: row.franchise_id,
        title: "Unknown",
        slug: "",
        cover_image_url: null,
        banner_image_url: null,
        genres: null,
        year_started: null,
        studio: null,
        status: null,
      },
    };
  });

  // Client-side sorting for title and progress (Supabase can't order by joined/computed columns)
  if (sort === "title") {
    items.sort((a, b) => a.franchise.title.localeCompare(b.franchise.title));
  } else if (sort === "progress") {
    items.sort((a, b) => b.progress - a.progress);
  }

  const total = count ?? 0;

  return NextResponse.json({
    items,
    total,
    page,
    hasMore: offset + limit < total,
  });
}

import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { awardAura } from "@/lib/aura";
import { NextResponse } from "next/server";
import type { EntryData } from "@/types/proposal";

/**
 * GET /api/route/[id] — fetch a route with author + hydrated entries,
 * ordered to match the route's `entry_ids` sequence.
 *
 * Respects RLS: non-approved routes are only returned for the author.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const routeId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: route, error } = await supabase
    .from("route")
    .select(
      "*, author:users!author_id(display_name, handle, avatar_url, era)",
    )
    .eq("id", routeId)
    .single();

  if (error || !route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  // Fetch the entries referenced by route.entry_ids and reorder them to match
  // the array order (Postgres returns them arbitrarily).
  const { data: entryRows } = await supabase
    .from("entry")
    .select(
      "id, franchise_id, position, title, entry_type, episode_start, episode_end, parent_series, anilist_id, is_essential, curator_note, cover_image_url",
    )
    .in("id", route.entry_ids)
    .eq("is_removed", false);

  const byId = new Map<string, EntryData>();
  for (const e of (entryRows ?? []) as EntryData[]) {
    byId.set(e.id, e);
  }
  const orderedEntries = route.entry_ids
    .map((id: string) => byId.get(id))
    .filter((e: EntryData | undefined): e is EntryData => !!e);

  // User-specific fields: vote + follow
  let userVote: number | null = null;
  let isFollowed = false;
  if (user) {
    const [{ data: vote }, { data: follow }] = await Promise.all([
      supabase
        .from("route_vote")
        .select("value")
        .eq("route_id", routeId)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("route_follow")
        .select("route_id")
        .eq("route_id", routeId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    userVote = vote?.value ?? null;
    isFollowed = !!follow;
  }

  return NextResponse.json({
    ...route,
    entries: orderedEntries,
    user_vote: userVote,
    is_followed: isFollowed,
  });
}

/**
 * DELETE /api/route/[id] — author deletes their own chronicle.
 *
 * Only allowed for `draft` and `in_review` states. Approved/canon chronicles
 * require admin action (or a separate "retire" flow) — deleting them would
 * orphan follower progress and break anyone linking to the route.
 *
 * If an in_review route is deleted, the +50 Archivist submit reward is
 * clawed back to keep the aura ledger honest.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const routeId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: route } = await supabase
    .from("route")
    .select("id, author_id, status")
    .eq("id", routeId)
    .single();

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  if (route.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (route.status === "approved" || route.status === "canon") {
    return NextResponse.json(
      {
        error:
          "Approved chronicles can't be deleted by the author. Contact an admin.",
      },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  // Clawback the submit reward if the route was in review.
  if (route.status === "in_review") {
    await awardAura(service, user.id, "archivist", -50);
  }

  const { error } = await service.from("route").delete().eq("id", routeId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

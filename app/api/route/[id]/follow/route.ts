import { createClient } from "@/lib/supabase-server";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const routeFollowLimiter = createRateLimiter("route-follow", {
  burstLimit: 20,
  burstWindowMs: 60_000,
  dailyLimit: 200,
});

/**
 * POST /api/route/[id]/follow — follow a route. Creates the row;
 * `sync_route_follower_count` trigger increments `route.follower_count`.
 */
export async function POST(
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

  const limit = routeFollowLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const { data: route } = await supabase
    .from("route")
    .select("id, status")
    .eq("id", routeId)
    .single();

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  if (route.status !== "approved" && route.status !== "canon") {
    return NextResponse.json(
      { error: "Route is not publicly available" },
      { status: 400 },
    );
  }

  // Idempotent — the primary key prevents duplicates, return 200 on conflict
  const { error } = await supabase
    .from("route_follow")
    .insert({ route_id: routeId, user_id: user.id });

  // 23505 = unique_violation (already following); treat as success
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: updated } = await supabase
    .from("route")
    .select("follower_count")
    .eq("id", routeId)
    .single();

  return NextResponse.json({ follower_count: updated?.follower_count ?? 0 });
}

/** DELETE /api/route/[id]/follow — unfollow */
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

  const limit = routeFollowLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  await supabase
    .from("route_follow")
    .delete()
    .eq("route_id", routeId)
    .eq("user_id", user.id);

  const { data: updated } = await supabase
    .from("route")
    .select("follower_count")
    .eq("id", routeId)
    .single();

  return NextResponse.json({ follower_count: updated?.follower_count ?? 0 });
}

import { createClient } from "@/lib/supabase-server";
import { routeVoteSchema } from "@/lib/validations/route";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const routeVoteLimiter = createRateLimiter("route-vote", {
  burstLimit: 20,
  burstWindowMs: 60_000,
  dailyLimit: 200,
});

/**
 * POST /api/route/[id]/vote — upvote or downvote a route.
 *
 * The DB trigger `sync_route_vote_count` keeps `route.vote_count` in sync,
 * so we only upsert the vote row and the count updates automatically.
 */
export async function POST(
  request: Request,
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

  const limit = routeVoteLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = routeVoteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Fetch route — need author for self-vote guard and status for open check
  const { data: route } = await supabase
    .from("route")
    .select("id, author_id, status")
    .eq("id", routeId)
    .single();

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  if (route.status !== "approved" && route.status !== "canon") {
    return NextResponse.json(
      { error: "Route is not open for voting" },
      { status: 400 },
    );
  }

  if (route.author_id === user.id) {
    return NextResponse.json(
      { error: "Cannot vote on your own route" },
      { status: 403 },
    );
  }

  const { data: existing } = await supabase
    .from("route_vote")
    .select("route_id, value")
    .eq("route_id", routeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    if (existing.value === result.data.value) {
      return NextResponse.json({ message: "Already voted" });
    }
    // Change vote — trigger applies the delta to vote_count
    const { error } = await supabase
      .from("route_vote")
      .update({ value: result.data.value })
      .eq("route_id", routeId)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("route_vote").insert({
      route_id: routeId,
      user_id: user.id,
      value: result.data.value,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // Read back the updated count so the client can render optimistically
  const { data: updated } = await supabase
    .from("route")
    .select("vote_count")
    .eq("id", routeId)
    .single();

  return NextResponse.json({ vote_count: updated?.vote_count ?? 0 });
}

/** DELETE /api/route/[id]/vote — remove the current user's vote */
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

  const limit = routeVoteLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  await supabase
    .from("route_vote")
    .delete()
    .eq("route_id", routeId)
    .eq("user_id", user.id);

  const { data: updated } = await supabase
    .from("route")
    .select("vote_count")
    .eq("id", routeId)
    .single();

  return NextResponse.json({ vote_count: updated?.vote_count ?? 0 });
}

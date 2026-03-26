import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { matchupVoteSchema } from "@/lib/validations/prediction";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const matchupVoteLimiter = createRateLimiter("matchup-vote", {
  burstLimit: 20,
  burstWindowMs: 60_000,
  dailyLimit: 200,
});

/** POST /api/matchup/[id]/vote — cast or change matchup vote */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const admin = createServiceClient();
  const matchupId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = matchupVoteLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = matchupVoteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { vote } = result.data;

  // Verify matchup exists and is active
  const { data: matchup } = await supabase
    .from("matchup")
    .select("id, status, votes_a, votes_b")
    .eq("id", matchupId)
    .single();

  if (!matchup) {
    return NextResponse.json({ error: "Matchup not found" }, { status: 404 });
  }
  if (matchup.status !== "active") {
    return NextResponse.json(
      { error: "Matchup is not active" },
      { status: 400 },
    );
  }

  // Check for existing vote
  const { data: existingVote } = await supabase
    .from("matchup_vote")
    .select("id, vote")
    .eq("matchup_id", matchupId)
    .eq("user_id", user.id)
    .single();

  if (existingVote) {
    if (existingVote.vote === vote) {
      // Same vote — return current state
      return NextResponse.json({
        votes_a: matchup.votes_a,
        votes_b: matchup.votes_b,
        userVote: vote,
      });
    }

    // Changing vote: update row
    const { error: updateErr } = await supabase
      .from("matchup_vote")
      .update({ vote })
      .eq("id", existingVote.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
  } else {
    // New vote
    const { error: insertErr } = await supabase
      .from("matchup_vote")
      .insert({ matchup_id: matchupId, user_id: user.id, vote });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  // Count actual votes from matchup_vote rows (avoids race conditions)
  const { count: countA } = await admin
    .from("matchup_vote")
    .select("*", { count: "exact", head: true })
    .eq("matchup_id", matchupId)
    .eq("vote", "a");

  const { count: countB } = await admin
    .from("matchup_vote")
    .select("*", { count: "exact", head: true })
    .eq("matchup_id", matchupId)
    .eq("vote", "b");

  const newVotesA = countA ?? 0;
  const newVotesB = countB ?? 0;

  // Sync denormalized counts
  await admin
    .from("matchup")
    .update({ votes_a: newVotesA, votes_b: newVotesB })
    .eq("id", matchupId);

  return NextResponse.json({
    votes_a: newVotesA,
    votes_b: newVotesB,
    userVote: vote,
  });
}

/** DELETE /api/matchup/[id]/vote — remove matchup vote */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const admin = createServiceClient();
  const matchupId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = matchupVoteLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const { data: vote } = await supabase
    .from("matchup_vote")
    .select("id, vote")
    .eq("matchup_id", matchupId)
    .eq("user_id", user.id)
    .single();

  if (!vote) {
    return NextResponse.json({ error: "No vote found" }, { status: 404 });
  }

  await supabase.from("matchup_vote").delete().eq("id", vote.id);

  // Count actual votes from matchup_vote rows
  const { count: countA } = await admin
    .from("matchup_vote")
    .select("*", { count: "exact", head: true })
    .eq("matchup_id", matchupId)
    .eq("vote", "a");

  const { count: countB } = await admin
    .from("matchup_vote")
    .select("*", { count: "exact", head: true })
    .eq("matchup_id", matchupId)
    .eq("vote", "b");

  const newVotesA = countA ?? 0;
  const newVotesB = countB ?? 0;

  await admin
    .from("matchup")
    .update({ votes_a: newVotesA, votes_b: newVotesB })
    .eq("id", matchupId);

  return NextResponse.json({
    votes_a: newVotesA,
    votes_b: newVotesB,
  });
}

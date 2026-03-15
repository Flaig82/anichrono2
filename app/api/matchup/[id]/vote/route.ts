import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { matchupVoteSchema } from "@/lib/validations/prediction";
import { NextResponse } from "next/server";

/** POST /api/matchup/[id]/vote — cast or change matchup vote */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const admin = createServiceClient();
  const matchupId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  let newVotesA = matchup.votes_a;
  let newVotesB = matchup.votes_b;

  if (existingVote) {
    if (existingVote.vote === vote) {
      // Same vote — return current state
      return NextResponse.json({
        votes_a: newVotesA,
        votes_b: newVotesB,
        userVote: vote,
      });
    }

    // Changing vote: update row, adjust counts
    const { error: updateErr } = await supabase
      .from("matchup_vote")
      .update({ vote })
      .eq("id", existingVote.id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Swing counts: remove from old side, add to new
    if (vote === "a") {
      newVotesA += 1;
      newVotesB -= 1;
    } else {
      newVotesB += 1;
      newVotesA -= 1;
    }
  } else {
    // New vote
    const { error: insertErr } = await supabase
      .from("matchup_vote")
      .insert({ matchup_id: matchupId, user_id: user.id, vote });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    if (vote === "a") {
      newVotesA += 1;
    } else {
      newVotesB += 1;
    }
  }

  // Update vote counts on matchup (service role bypasses RLS)
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
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const admin = createServiceClient();
  const matchupId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  // Decrement the appropriate count (service role bypasses RLS)
  const { data: matchup } = await supabase
    .from("matchup")
    .select("votes_a, votes_b")
    .eq("id", matchupId)
    .single();

  if (matchup) {
    const updates =
      vote.vote === "a"
        ? { votes_a: matchup.votes_a - 1 }
        : { votes_b: matchup.votes_b - 1 };

    await admin.from("matchup").update(updates).eq("id", matchupId);

    return NextResponse.json({
      votes_a: vote.vote === "a" ? matchup.votes_a - 1 : matchup.votes_a,
      votes_b: vote.vote === "b" ? matchup.votes_b - 1 : matchup.votes_b,
    });
  }

  return NextResponse.json({ success: true });
}

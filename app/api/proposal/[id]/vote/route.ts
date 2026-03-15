import { createClient } from "@/lib/supabase-server";
import { voteSchema } from "@/lib/validations/proposal";
import { NextResponse } from "next/server";
import { progressQuests, type CompletedQuest } from "@/lib/quests";

const APPLY_THRESHOLD = 10;
const REJECT_THRESHOLD = -5;

/** POST /api/proposal/[id]/vote — upsert a vote on a proposal */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const proposalId = params.id;

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Validate body
  const body: unknown = await request.json();
  const result = voteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Fetch proposal
  const { data: proposal } = await supabase
    .from("order_proposal")
    .select("id, author_id, status, franchise_id, proposed_entries, vote_score")
    .eq("id", proposalId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status !== "open") {
    return NextResponse.json(
      { error: "Proposal is no longer open" },
      { status: 400 },
    );
  }

  // Can't vote on own proposal
  if (proposal.author_id === user.id) {
    return NextResponse.json(
      { error: "Cannot vote on your own proposal" },
      { status: 403 },
    );
  }

  // Check for existing vote
  const { data: existingVote } = await supabase
    .from("proposal_vote")
    .select("id, value")
    .eq("proposal_id", proposalId)
    .eq("user_id", user.id)
    .single();

  let scoreDelta = result.data.value;
  let completedQuests: CompletedQuest[] = [];

  if (existingVote) {
    if (existingVote.value === result.data.value) {
      return NextResponse.json({ message: "Already voted" });
    }
    // Changing vote: undo old vote + apply new
    scoreDelta = result.data.value - existingVote.value;

    const { error: updateError } = await supabase
      .from("proposal_vote")
      .update({ value: result.data.value })
      .eq("id", existingVote.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }
  } else {
    const { error: insertError } = await supabase
      .from("proposal_vote")
      .insert({
        proposal_id: proposalId,
        user_id: user.id,
        value: result.data.value,
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    // Progress quests on new vote (not vote changes)
    completedQuests = await progressQuests(supabase, user.id, "vote_proposal", 1);
  }

  // Update vote_score on proposal
  const newScore = proposal.vote_score + scoreDelta;

  const { error: scoreError } = await supabase
    .from("order_proposal")
    .update({ vote_score: newScore, updated_at: new Date().toISOString() })
    .eq("id", proposalId);

  if (scoreError) {
    return NextResponse.json({ error: scoreError.message }, { status: 500 });
  }

  // Check thresholds: move to pending_approval or auto-reject
  if (newScore >= APPLY_THRESHOLD) {
    await supabase
      .from("order_proposal")
      .update({
        status: "pending_approval",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
  } else if (newScore <= REJECT_THRESHOLD) {
    await supabase
      .from("order_proposal")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
  }

  return NextResponse.json({ vote_score: newScore, completedQuests });
}

/** DELETE /api/proposal/[id]/vote — remove the current user's vote */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const proposalId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Find existing vote
  const { data: vote } = await supabase
    .from("proposal_vote")
    .select("id, value")
    .eq("proposal_id", proposalId)
    .eq("user_id", user.id)
    .single();

  if (!vote) {
    return NextResponse.json({ error: "No vote found" }, { status: 404 });
  }

  // Delete vote
  await supabase.from("proposal_vote").delete().eq("id", vote.id);

  // Subtract this vote from score
  const { data: proposal } = await supabase
    .from("order_proposal")
    .select("vote_score")
    .eq("id", proposalId)
    .single();

  if (proposal) {
    await supabase
      .from("order_proposal")
      .update({
        vote_score: proposal.vote_score - vote.value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId);
  }

  return NextResponse.json({ success: true });
}


import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { awardVoteSchema } from "@/lib/validations/prediction";
import { NextResponse } from "next/server";

/** POST /api/award/[id]/vote — cast or change award vote */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const admin = createServiceClient();
  const awardId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const result = awardVoteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { nominee_id } = result.data;

  // Verify award exists and is active
  const { data: award } = await supabase
    .from("award")
    .select("id, status")
    .eq("id", awardId)
    .single();

  if (!award) {
    return NextResponse.json({ error: "Award not found" }, { status: 404 });
  }
  if (award.status !== "active") {
    return NextResponse.json(
      { error: "Award voting is closed" },
      { status: 400 },
    );
  }

  // Verify nominee belongs to this award
  const { data: nominee } = await supabase
    .from("award_nominee")
    .select("id, award_id")
    .eq("id", nominee_id)
    .single();

  if (!nominee || nominee.award_id !== awardId) {
    return NextResponse.json(
      { error: "Nominee not found in this award" },
      { status: 400 },
    );
  }

  // Check existing vote
  const { data: existingVote } = await supabase
    .from("award_vote")
    .select("id, nominee_id")
    .eq("award_id", awardId)
    .eq("user_id", user.id)
    .single();

  if (existingVote) {
    if (existingVote.nominee_id === nominee_id) {
      // Same vote — return current state
      return NextResponse.json({ message: "Already voted for this nominee" });
    }

    // Changing vote: decrement old nominee, increment new, update vote row
    const { data: oldNominee } = await admin
      .from("award_nominee")
      .select("votes")
      .eq("id", existingVote.nominee_id)
      .single();

    if (oldNominee) {
      await admin
        .from("award_nominee")
        .update({ votes: Math.max(0, oldNominee.votes - 1) })
        .eq("id", existingVote.nominee_id);
    }

    const { data: newNominee } = await admin
      .from("award_nominee")
      .select("votes")
      .eq("id", nominee_id)
      .single();

    if (newNominee) {
      await admin
        .from("award_nominee")
        .update({ votes: newNominee.votes + 1 })
        .eq("id", nominee_id);
    }

    await supabase
      .from("award_vote")
      .update({ nominee_id })
      .eq("id", existingVote.id);
  } else {
    // New vote
    const { error: insertErr } = await supabase
      .from("award_vote")
      .insert({ award_id: awardId, nominee_id, user_id: user.id });

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Increment nominee votes (service role bypasses RLS)
    const { data: nom } = await admin
      .from("award_nominee")
      .select("votes")
      .eq("id", nominee_id)
      .single();

    if (nom) {
      await admin
        .from("award_nominee")
        .update({ votes: nom.votes + 1 })
        .eq("id", nominee_id);
    }
  }

  // Return updated nominees
  const { data: nominees } = await supabase
    .from("award_nominee")
    .select("id, anime_id, title, cover_image_url, votes")
    .eq("award_id", awardId)
    .order("votes", { ascending: false });

  return NextResponse.json({
    nominees: nominees ?? [],
    userVoteNomineeId: nominee_id,
  });
}

/** DELETE /api/award/[id]/vote — remove award vote */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const admin = createServiceClient();
  const awardId = params.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: vote } = await supabase
    .from("award_vote")
    .select("id, nominee_id")
    .eq("award_id", awardId)
    .eq("user_id", user.id)
    .single();

  if (!vote) {
    return NextResponse.json({ error: "No vote found" }, { status: 404 });
  }

  // Decrement nominee votes (service role bypasses RLS)
  const { data: nom } = await admin
    .from("award_nominee")
    .select("votes")
    .eq("id", vote.nominee_id)
    .single();

  if (nom) {
    await admin
      .from("award_nominee")
      .update({ votes: Math.max(0, nom.votes - 1) })
      .eq("id", vote.nominee_id);
  }

  await supabase.from("award_vote").delete().eq("id", vote.id);

  // Return updated nominees
  const { data: nominees } = await supabase
    .from("award_nominee")
    .select("id, anime_id, title, cover_image_url, votes")
    .eq("award_id", awardId)
    .order("votes", { ascending: false });

  return NextResponse.json({
    nominees: nominees ?? [],
    userVoteNomineeId: null,
  });
}

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/proposal/[id] — fetch a single proposal with author info and user vote */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const proposalId = params.id;

  // Fetch proposal with author join
  const { data: proposal, error } = await supabase
    .from("order_proposal")
    .select(
      `
      id,
      franchise_id,
      author_id,
      title,
      description,
      proposed_entries,
      status,
      vote_score,
      applied_at,
      created_at,
      updated_at,
      author:users!order_proposal_author_id_fkey (
        display_name,
        handle,
        avatar_url,
        era
      )
    `,
    )
    .eq("id", proposalId)
    .single();

  if (error || !proposal) {
    return NextResponse.json(
      { error: "Proposal not found" },
      { status: 404 },
    );
  }

  // Check if current user has voted
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userVote: number | null = null;
  if (user) {
    const { data: vote } = await supabase
      .from("proposal_vote")
      .select("value")
      .eq("proposal_id", proposalId)
      .eq("user_id", user.id)
      .single();

    userVote = vote?.value ?? null;
  }

  return NextResponse.json({
    ...proposal,
    user_vote: userVote,
  });
}

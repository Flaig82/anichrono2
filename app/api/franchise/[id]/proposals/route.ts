import { createClient } from "@/lib/supabase-server";
import { createProposalSchema } from "@/lib/validations/proposal";
import { NextResponse } from "next/server";

/** GET /api/franchise/[id]/proposals — list open proposals for a franchise */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const franchiseId = params.id;

  // Get current user for vote info
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: proposals, error } = await supabase
    .from("order_proposal")
    .select("*, author:users!author_id(display_name, handle, avatar_url, era)")
    .eq("franchise_id", franchiseId)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If user is logged in, fetch their votes on these proposals
  const userVotes: Record<string, number> = {};
  if (user && proposals.length > 0) {
    const proposalIds = proposals.map((p: { id: string }) => p.id);
    const { data: votes } = await supabase
      .from("proposal_vote")
      .select("proposal_id, value")
      .eq("user_id", user.id)
      .in("proposal_id", proposalIds);

    if (votes) {
      for (const v of votes) {
        userVotes[v.proposal_id] = v.value;
      }
    }
  }

  const enriched = proposals.map((p: { id: string }) => ({
    ...p,
    user_vote: userVotes[p.id] ?? null,
  }));

  return NextResponse.json(enriched);
}

/** POST /api/franchise/[id]/proposals — create a new proposal */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const franchiseId = params.id;

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Era check — must be Wanderer+ (500+ Aura)
  const { data: profile } = await supabase
    .from("users")
    .select("era")
    .eq("id", user.id)
    .single();

  if (!profile || profile.era === "initiate") {
    return NextResponse.json(
      { error: "Reach Wanderer era (500 Aura) to propose edits" },
      { status: 403 },
    );
  }

  // Rate limit — max 3 open proposals per week
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { count } = await supabase
    .from("order_proposal")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .eq("status", "open")
    .gte("created_at", oneWeekAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Maximum 3 open proposals per week" },
      { status: 429 },
    );
  }

  // Validate body
  const body: unknown = await request.json();
  const result = createProposalSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Verify franchise exists
  const { data: franchise } = await supabase
    .from("franchise")
    .select("id")
    .eq("id", franchiseId)
    .single();

  if (!franchise) {
    return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
  }

  // Create proposal
  const { data: proposal, error } = await supabase
    .from("order_proposal")
    .insert({
      franchise_id: franchiseId,
      author_id: user.id,
      title: result.data.title,
      description: result.data.description ?? null,
      proposed_entries: result.data.proposed_entries,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(proposal, { status: 201 });
}

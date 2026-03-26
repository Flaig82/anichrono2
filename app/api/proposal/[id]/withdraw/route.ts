import { createClient } from "@/lib/supabase-server";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const withdrawLimiter = createRateLimiter("proposal-withdraw", {
  burstLimit: 10,
  burstWindowMs: 60_000,
  dailyLimit: 50,
});

/** POST /api/proposal/[id]/withdraw — author withdraws their own proposal */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const proposalId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = withdrawLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const { data: proposal } = await supabase
    .from("order_proposal")
    .select("id, author_id, status")
    .eq("id", proposalId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.author_id !== user.id) {
    return NextResponse.json(
      { error: "Only the author can withdraw a proposal" },
      { status: 403 },
    );
  }

  if (proposal.status !== "open") {
    return NextResponse.json(
      { error: "Proposal is no longer open" },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("order_proposal")
    .update({
      status: "withdrawn",
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { applyProposal } from "@/lib/apply-proposal";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const adminActionLimiter = createRateLimiter("admin-actions", {
  burstLimit: 20,
  burstWindowMs: 60_000,
  dailyLimit: 200,
});

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

/** POST /api/admin/proposal/[id] — approve or reject a pending proposal */
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

  // Admin check
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = adminActionLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  // Validate body
  const body: unknown = await request.json();
  const result = actionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Fetch proposal
  const { data: proposal } = await supabase
    .from("order_proposal")
    .select("id, franchise_id, proposed_entries, author_id, status")
    .eq("id", proposalId)
    .single();

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status !== "pending_approval" && proposal.status !== "open") {
    return NextResponse.json(
      { error: "Proposal is not open or pending approval" },
      { status: 400 },
    );
  }

  if (result.data.action === "approve") {
    await applyProposal(
      proposalId,
      proposal.franchise_id,
      proposal.proposed_entries,
      proposal.author_id,
    );
    return NextResponse.json({ status: "applied" });
  }

  // Reject
  const service = createServiceClient();
  await service
    .from("order_proposal")
    .update({
      status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  return NextResponse.json({ status: "rejected" });
}

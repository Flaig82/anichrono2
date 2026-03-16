import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-service";

/** GET /api/admin/franchises — top franchises with entry/proposal counts */
export async function GET(request: NextRequest) {
  const supabase = createClient();

  // Auth + admin check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const sort = searchParams.get("sort") ?? "entry_count";
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "30", 10));

  // Use service client to bypass any RLS for aggregation
  const service = createServiceClient();

  // Fetch franchises with entry counts
  const { data: franchises, error: fError } = await service
    .from("franchise")
    .select("id, title, slug, cover_image_url, status, created_at");

  if (fError) {
    return NextResponse.json({ error: fError.message }, { status: 500 });
  }

  // Get entry counts per franchise
  const { data: entryCounts } = await service
    .from("franchise_entry")
    .select("franchise_id")
    .not("deleted_at", "is", null)
    .is("deleted_at", null);

  // Count entries per franchise
  const entryCountMap: Record<string, number> = {};
  if (entryCounts) {
    for (const e of entryCounts) {
      entryCountMap[e.franchise_id] =
        (entryCountMap[e.franchise_id] || 0) + 1;
    }
  }

  // Get proposal counts per franchise
  const { data: proposalCounts } = await service
    .from("order_proposal")
    .select("franchise_id, status");

  const proposalCountMap: Record<string, number> = {};
  if (proposalCounts) {
    for (const p of proposalCounts) {
      proposalCountMap[p.franchise_id] =
        (proposalCountMap[p.franchise_id] || 0) + 1;
    }
  }

  // Merge and sort
  const enriched = (franchises ?? []).map((f) => ({
    ...f,
    entry_count: entryCountMap[f.id] ?? 0,
    proposal_count: proposalCountMap[f.id] ?? 0,
  }));

  if (sort === "proposal_count") {
    enriched.sort((a, b) => b.proposal_count - a.proposal_count);
  } else if (sort === "created_at") {
    enriched.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    // Default: entry_count
    enriched.sort((a, b) => b.entry_count - a.entry_count);
  }

  return NextResponse.json(enriched.slice(0, limit));
}

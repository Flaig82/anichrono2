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

  // Single query with embedded count joins — no JS aggregation needed
  const { data: franchises, error: fError } = await service
    .from("franchise")
    .select(
      "id, title, slug, cover_image_url, status, created_at, entry(count), order_proposal(count)",
    );

  if (fError) {
    return NextResponse.json({ error: fError.message }, { status: 500 });
  }

  // Flatten embedded counts and sort
  // Cast needed: service client is untyped, embedded count joins resolve to `never`
  type FranchiseWithCounts = {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    status: string;
    created_at: string;
    entry: { count: number }[];
    order_proposal: { count: number }[];
  };
  const rows = (franchises ?? []) as unknown as FranchiseWithCounts[];
  const enriched = rows.map((f) => ({
    id: f.id,
    title: f.title,
    slug: f.slug,
    cover_image_url: f.cover_image_url,
    status: f.status,
    created_at: f.created_at,
    entry_count: f.entry?.[0]?.count ?? 0,
    proposal_count: f.order_proposal?.[0]?.count ?? 0,
  }));

  if (sort === "proposal_count") {
    enriched.sort((a, b) => b.proposal_count - a.proposal_count);
  } else if (sort === "created_at") {
    enriched.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  } else {
    enriched.sort((a, b) => b.entry_count - a.entry_count);
  }

  return NextResponse.json(enriched.slice(0, limit));
}

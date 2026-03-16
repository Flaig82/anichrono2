import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/admin/stats — dashboard overview data */
export async function GET() {
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

  // Parallel queries for all stats
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const fifteenMinAgo = new Date(
    Date.now() - 15 * 60 * 1000,
  ).toISOString();

  const [
    totalUsersRes,
    newUsersRes,
    totalFranchisesRes,
    proposalCountsRes,
    activeUsersRes,
    topUsersRes,
    recentActivityRes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo),
    supabase.from("franchise").select("id", { count: "exact", head: true }),
    supabase
      .from("order_proposal")
      .select("status"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", fifteenMinAgo),
    supabase
      .from("users")
      .select("id, display_name, handle, avatar_url, era, total_aura")
      .order("total_aura", { ascending: false })
      .limit(10),
    supabase
      .from("activity")
      .select(
        `id, user_id, type, created_at, metadata,
        user:user_id (display_name, handle, avatar_url),
        franchise:franchise_id (title, slug),
        entry:entry_id (title)`,
      )
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Count proposals by status
  const proposalsByStatus: Record<string, number> = {};
  if (proposalCountsRes.data) {
    for (const p of proposalCountsRes.data) {
      proposalsByStatus[p.status] = (proposalsByStatus[p.status] || 0) + 1;
    }
  }

  return NextResponse.json({
    totalUsers: totalUsersRes.count ?? 0,
    newUsersThisWeek: newUsersRes.count ?? 0,
    totalFranchises: totalFranchisesRes.count ?? 0,
    proposalsByStatus,
    activeUsers: activeUsersRes.count ?? 0,
    topUsers: topUsersRes.data ?? [],
    recentActivity: recentActivityRes.data ?? [],
  });
}

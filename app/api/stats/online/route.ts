import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/stats/online — count + avatars of recently active users */
export async function GET() {
  const supabase = createClient();

  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  // Get distinct users who have activity in the last 15 minutes
  const { data, error } = await supabase
    .from("activity")
    .select("user_id, user:users!user_id(avatar_url, display_name)")
    .gte("created_at", fifteenMinAgo)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ count: 0, users: [] });
  }

  // Dedupe by user_id, keep first (most recent) occurrence, max 4
  const seen = new Set<string>();
  const users: { avatar_url: string | null; display_name: string | null }[] = [];
  for (const row of data ?? []) {
    if (seen.has(row.user_id)) continue;
    seen.add(row.user_id);
    if (users.length < 4) {
      const user = Array.isArray(row.user) ? row.user[0] : row.user;
      users.push({
        avatar_url: user?.avatar_url ?? null,
        display_name: user?.display_name ?? null,
      });
    }
  }

  return NextResponse.json({ count: seen.size, users });
}

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/admin/proposals — fetch all pending_approval proposals */
export async function GET() {
  const supabase = createClient();

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

  // Fetch pending_approval proposals with author and franchise info
  const { data: proposals, error } = await supabase
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
      created_at,
      updated_at,
      franchise:franchise_id (id, title, slug, cover_image_url),
      author:author_id (display_name, handle, avatar_url, era)
    `,
    )
    .eq("status", "pending_approval")
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(proposals);
}

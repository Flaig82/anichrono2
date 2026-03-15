import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/activity/live — 15 most recent user actions for the live feed */
export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activity")
    .select(
      "id, user_id, type, created_at, metadata, user:users!user_id(display_name, handle, avatar_url), franchise:franchise!franchise_id(title, slug), entry:entry!entry_id(title)",
    )
    .in("type", ["complete_entry", "start_watching", "review", "rate", "drop", "add_to_watchlist"])
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

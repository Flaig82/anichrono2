import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/notifications/unread-count — unread count for badge */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ count: 0 });
  }

  const { count } = await supabase
    .from("notification")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false);

  return NextResponse.json({ count: count ?? 0 });
}

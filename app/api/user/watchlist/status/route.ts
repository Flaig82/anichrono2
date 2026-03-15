import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/user/watchlist/status?franchise_id=X — check if franchise is on watchlist */
export async function GET(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ status: null });
  }

  const url = new URL(request.url);
  const franchiseId = url.searchParams.get("franchise_id");
  if (!franchiseId) {
    return NextResponse.json(
      { error: "franchise_id required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("franchise_watchlist")
    .select("status")
    .eq("user_id", user.id)
    .eq("franchise_id", franchiseId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: data?.status ?? null });
}

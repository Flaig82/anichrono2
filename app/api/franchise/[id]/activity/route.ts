import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

/** GET /api/franchise/[id]/activity — pending + recent proposals for sidebar */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const franchiseId = params.id;

  // Fetch open + pending_approval proposals (pending updates)
  const { data: pending } = await supabase
    .from("order_proposal")
    .select(
      "id, title, description, vote_score, status, created_at, author:users!author_id(display_name, avatar_url)",
    )
    .eq("franchise_id", franchiseId)
    .in("status", ["open", "pending_approval"])
    .order("created_at", { ascending: false })
    .limit(3);

  // Fetch recently applied proposals (recent updates)
  const { data: recent } = await supabase
    .from("order_proposal")
    .select(
      "id, title, description, vote_score, applied_at, created_at, author:users!author_id(display_name, avatar_url)",
    )
    .eq("franchise_id", franchiseId)
    .eq("status", "applied")
    .order("applied_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    pending: pending ?? [],
    recent: recent ?? [],
  });
}

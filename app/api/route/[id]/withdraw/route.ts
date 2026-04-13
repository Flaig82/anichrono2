import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { awardAura } from "@/lib/aura";
import { NextResponse } from "next/server";

/**
 * POST /api/route/[id]/withdraw — pull an in_review route back to draft.
 *
 * Mirrors GitHub's "Convert to draft" on a pull request. Author-only action.
 * Clawbacks the +50 Archivist since the submit reward is supposed to
 * represent a route going through review.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const routeId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: route } = await supabase
    .from("route")
    .select("id, author_id, status")
    .eq("id", routeId)
    .single();

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  if (route.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (route.status !== "in_review") {
    return NextResponse.json(
      { error: "Only in-review chronicles can be withdrawn" },
      { status: 400 },
    );
  }

  const service = createServiceClient();
  const { error } = await service
    .from("route")
    .update({
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clawback the aura granted at submit time.
  await awardAura(service, user.id, "archivist", -50);

  return NextResponse.json({ status: "draft" });
}

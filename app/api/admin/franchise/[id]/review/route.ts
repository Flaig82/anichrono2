import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createRateLimiter } from "@/lib/rate-limit";
import { awardAura } from "@/lib/aura";
import { NextResponse } from "next/server";
import { z } from "zod";

const reviewLimiter = createRateLimiter("admin-franchise-review", {
  burstLimit: 30,
  burstWindowMs: 60_000,
  dailyLimit: 300,
});

const actionSchema = z.object({
  action: z.enum(["approve", "deny"]),
});

/**
 * POST /api/admin/franchise/[id]/review — approve or deny a draft franchise.
 *
 * approve → review_status 'draft'|'rejected' → 'live'; awards the deferred
 *           +50 Archivist aura to the franchise creator (once, on first go-live).
 * deny    → review_status 'draft' → 'rejected' (soft — kept for audit / re-approval).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const franchiseId = (await params).id;

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

  const limit = reviewLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const result = actionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  // Service client bypasses RLS, so drafts are visible here.
  const { data: franchise } = await service
    .from("franchise")
    .select("id, review_status, created_by, title")
    .eq("id", franchiseId)
    .single();

  if (!franchise) {
    return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
  }

  if (result.data.action === "approve") {
    if (franchise.review_status === "live") {
      return NextResponse.json(
        { error: "Franchise is already live" },
        { status: 400 },
      );
    }
    await service
      .from("franchise")
      .update({ review_status: "live", updated_at: new Date().toISOString() })
      .eq("id", franchiseId);

    // Award the deferred +50 Archivist to the creator. Reached only from
    // draft/rejected (live is rejected above), so the franchise has never been
    // live before — the aura is granted exactly once.
    if (franchise.created_by) {
      await awardAura(service, franchise.created_by, "archivist", 50);
    }
    return NextResponse.json({ review_status: "live" });
  }

  // deny
  if (franchise.review_status !== "draft") {
    return NextResponse.json(
      { error: "Only draft franchises can be denied" },
      { status: 400 },
    );
  }
  await service
    .from("franchise")
    .update({ review_status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", franchiseId);
  return NextResponse.json({ review_status: "rejected" });
}

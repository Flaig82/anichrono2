import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const adminActionLimiter = createRateLimiter("admin-route-actions", {
  burstLimit: 20,
  burstWindowMs: 60_000,
  dailyLimit: 200,
});

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "canonize"]),
  reject_reason: z.string().max(500).optional(),
});

/**
 * POST /api/admin/route/[id] — approve, reject, or canonize a pending route.
 *
 * approve  → status 'in_review' → 'approved'
 * reject   → status 'in_review' → 'draft' (author can resubmit later)
 * canonize → status 'approved' → 'canon', sets is_canon true
 */
export async function POST(
  request: Request,
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

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limit = adminActionLimiter.check(user.id);
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

  const { data: route } = await supabase
    .from("route")
    .select("id, status, author_id, title")
    .eq("id", routeId)
    .single();

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  const service = createServiceClient();

  if (result.data.action === "approve") {
    if (route.status !== "in_review") {
      return NextResponse.json(
        { error: "Route is not pending review" },
        { status: 400 },
      );
    }
    await service
      .from("route")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", routeId);
    return NextResponse.json({ status: "approved" });
  }

  if (result.data.action === "reject") {
    if (route.status !== "in_review") {
      return NextResponse.json(
        { error: "Route is not pending review" },
        { status: 400 },
      );
    }
    const reason = result.data.reject_reason?.trim() || null;
    if (!reason) {
      return NextResponse.json(
        { error: "A reject reason is required" },
        { status: 400 },
      );
    }
    await service
      .from("route")
      .update({
        status: "draft",
        reject_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", routeId);
    return NextResponse.json({ status: "draft" });
  }

  // canonize — promote an approved route to canon
  if (route.status !== "approved") {
    return NextResponse.json(
      { error: "Only approved routes can be canonized" },
      { status: 400 },
    );
  }
  await service
    .from("route")
    .update({
      status: "canon",
      is_canon: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId);
  return NextResponse.json({ status: "canon" });
}

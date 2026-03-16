import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";

const adminUserLimiter = createRateLimiter("admin-user-update", {
  burstLimit: 20,
  burstWindowMs: 60_000,
  dailyLimit: 200,
});

/** PATCH /api/admin/users/[id] — update user (admin toggle, aura, era) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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

  const limit = adminUserLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (typeof body.is_admin === "boolean") {
    updates.is_admin = body.is_admin;
  }
  if (typeof body.total_aura === "number") {
    updates.total_aura = body.total_aura;
  }
  if (typeof body.era === "string") {
    updates.era = body.era;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  // Use service client to bypass RLS
  const service = createServiceClient();
  const { data, error } = await service
    .from("users")
    .update(updates)
    .eq("id", params.id)
    .select(
      "id, display_name, handle, avatar_url, email, era, total_aura, is_admin, created_at",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

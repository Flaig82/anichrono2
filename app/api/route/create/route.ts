import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { createRouteSchema } from "@/lib/validations/route";
import { requireEra, ERA_UNLOCKS } from "@/lib/era";
import { createRateLimiter } from "@/lib/rate-limit";
import { checkFieldsForProfanity } from "@/lib/profanity";
import { NextResponse } from "next/server";

const routeCreateLimiter = createRateLimiter("route-create", {
  burstLimit: 3,
  burstWindowMs: 60_000,
  dailyLimit: 10,
});

/**
 * POST /api/route/create — create a new Chronicle (route) as a private draft.
 *
 * Gated at Wanderer era (500 Aura). Routes start in `draft` status — only
 * the author can see them. Author must explicitly call
 * POST /api/route/[id]/submit to move to `in_review` (at which point the
 * +50 Archivist reward is granted). This preserves a testing/work-in-progress
 * path without polluting the public surface or the admin queue.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const limit = routeCreateLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  // Era check — same 500 Aura gate as edit proposals and franchise creation.
  const gate = await requireEra(supabase, user.id, ERA_UNLOCKS.route.minAura);
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: "Reach Wanderer era (500 Aura) to create chronicles",
        totalAura: gate.totalAura,
        needed: gate.needed,
      },
      { status: 403 },
    );
  }

  // Validate body
  const body: unknown = await request.json();
  const result = createRouteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data = result.data;

  // Profanity check
  const profaneField = checkFieldsForProfanity({
    title: data.title,
    summary: data.summary ?? null,
  });
  if (profaneField) {
    return NextResponse.json(
      { error: `Inappropriate language detected in ${profaneField}` },
      { status: 400 },
    );
  }

  // Validate that the franchise exists and every entry_id belongs to it.
  // This is the critical integrity check — entry_ids is a uuid[] with no
  // foreign key, so orphan IDs would be accepted silently otherwise.
  const { data: franchise } = await supabase
    .from("franchise")
    .select("id")
    .eq("id", data.franchise_id)
    .single();

  if (!franchise) {
    return NextResponse.json({ error: "Franchise not found" }, { status: 404 });
  }

  const { data: validEntries } = await supabase
    .from("entry")
    .select("id")
    .eq("franchise_id", data.franchise_id)
    .eq("is_removed", false)
    .in("id", data.entry_ids);

  const validIds = new Set((validEntries ?? []).map((e) => e.id));
  const invalid = data.entry_ids.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `${invalid.length} entries don't belong to this franchise` },
      { status: 400 },
    );
  }

  // Draft-stage rate limit — limits raw draft creation, not submissions.
  // Keeps spam bots from flooding the table even if they never submit.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("route")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .gte("created_at", oneDayAgo);

  if ((count ?? 0) >= 20) {
    return NextResponse.json(
      { error: "Maximum 20 drafts per day" },
      { status: 429 },
    );
  }

  // Insert as draft — private to author until they submit.
  const service = createServiceClient();
  const { data: route, error } = await service
    .from("route")
    .insert({
      franchise_id: data.franchise_id,
      author_id: user.id,
      title: data.title.trim(),
      route_type: data.route_type,
      entry_ids: data.entry_ids,
      summary: data.summary?.trim() || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !route) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create route" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id: route.id }, { status: 201 });
}

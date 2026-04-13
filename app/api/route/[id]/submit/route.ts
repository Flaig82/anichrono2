import { createClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-service";
import { awardAura } from "@/lib/aura";
import { requireEra, ERA_UNLOCKS } from "@/lib/era";
import { getAuthorTrustTier } from "@/lib/route-trust";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const submitLimiter = createRateLimiter("route-submit", {
  burstLimit: 3,
  burstWindowMs: 60_000,
  dailyLimit: 10,
});

/**
 * POST /api/route/[id]/submit — transition author's own draft to in_review.
 *
 * This is the moment a route becomes visible to admins (via the review queue)
 * and the author earns +50 Archivist. Pre-submit, routes are private drafts —
 * testers and work-in-progress contributors don't pollute anything.
 *
 * Also enforces the "max 3 in-review routes per week" rate limit here rather
 * than on draft creation, so authors can draft freely.
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

  const limit = submitLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  // Re-check era at submit time (draft creation also checks, but the user
  // could theoretically lose aura between creation and submit).
  const gate = await requireEra(supabase, user.id, ERA_UNLOCKS.route.minAura);
  if (!gate.ok) {
    return NextResponse.json(
      {
        error: "Reach Wanderer era (500 Aura) to submit chronicles",
        needed: gate.needed,
      },
      { status: 403 },
    );
  }

  // Fetch the route and verify ownership + state
  const { data: route } = await supabase
    .from("route")
    .select("id, author_id, status, entry_ids")
    .eq("id", routeId)
    .single();

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  if (route.author_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (route.status !== "draft") {
    return NextResponse.json(
      { error: "Only drafts can be submitted for review" },
      { status: 400 },
    );
  }
  if (!route.entry_ids || route.entry_ids.length < 2) {
    return NextResponse.json(
      { error: "A chronicle needs at least 2 entries" },
      { status: 400 },
    );
  }

  // --- Quality guardrails ---

  // Fetch route metadata for guardrail checks
  const { data: routeMeta } = await supabase
    .from("route")
    .select("franchise_id, route_type")
    .eq("id", routeId)
    .single();

  if (routeMeta) {
    // 1. Duplicate detection — reject if an approved/canon route exists
    //    with the exact same (franchise_id, route_type, entry_ids).
    const { data: existing } = await supabase
      .from("route")
      .select("id, entry_ids")
      .eq("franchise_id", routeMeta.franchise_id)
      .eq("route_type", routeMeta.route_type)
      .in("status", ["approved", "canon"])
      .neq("id", routeId);

    if (existing) {
      const sorted = [...route.entry_ids].sort();
      for (const r of existing) {
        const otherSorted = [...(r.entry_ids as string[])].sort();
        if (
          sorted.length === otherSorted.length &&
          sorted.every((id, i) => id === otherSorted[i])
        ) {
          return NextResponse.json(
            {
              error:
                "An approved chronicle with the same entries and route type already exists. Try a different selection or route type.",
            },
            { status: 400 },
          );
        }
      }
    }

    // 2. Master-order-match rejection — reject chronological routes whose
    //    entries are identical to the master order (no value added).
    if (routeMeta.route_type === "chronological") {
      const { data: masterEntries } = await supabase
        .from("entry")
        .select("id")
        .eq("franchise_id", routeMeta.franchise_id)
        .eq("is_removed", false)
        .order("position", { ascending: true });

      if (masterEntries) {
        const masterIds = masterEntries.map((e) => e.id);
        if (
          masterIds.length === route.entry_ids.length &&
          masterIds.every((id, i) => id === route.entry_ids[i])
        ) {
          return NextResponse.json(
            {
              error:
                "This matches the default chronological order exactly. Use 'Propose an edit' to improve the master order instead.",
            },
            { status: 400 },
          );
        }
      }
    }
  }

  // Weekly in-review cap (moved from create → submit)
  const oneWeekAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { count } = await supabase
    .from("route")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .eq("status", "in_review")
    .gte("updated_at", oneWeekAgo);

  if ((count ?? 0) >= 3) {
    return NextResponse.json(
      { error: "Maximum 3 in-review chronicles per week" },
      { status: 429 },
    );
  }

  // Check trust tier — proven contributors skip the admin queue.
  const trust = await getAuthorTrustTier(supabase, user.id);
  const targetStatus = trust.canAutoApprove ? "approved" : "in_review";

  // Trusted authors (tier 2) get a relaxed weekly cap: 10 instead of 3.
  if (!trust.canAutoApprove && (count ?? 0) >= 3) {
    // Already checked above for tier 0, but re-state for clarity
  } else if (trust.level === 2) {
    // Tier 2 relaxed limit — re-check with higher cap
    const { count: tier2Count } = await supabase
      .from("route")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .in("status", ["in_review", "approved"])
      .gte("updated_at", oneWeekAgo);

    if ((tier2Count ?? 0) >= 10) {
      return NextResponse.json(
        { error: "Maximum 10 chronicles per week (trusted contributor limit)" },
        { status: 429 },
      );
    }
  }

  // Transition
  const service = createServiceClient();
  const { error } = await service
    .from("route")
    .update({
      status: targetStatus,
      reject_reason: null, // Clear any previous rejection reason on resubmit
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Award +50 Archivist at submit (not at draft create)
  await awardAura(service, user.id, "archivist", 50);

  return NextResponse.json({
    status: targetStatus,
    auto_approved: trust.canAutoApprove,
    trust_level: trust.level,
  });
}

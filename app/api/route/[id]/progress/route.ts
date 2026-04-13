import { createClient } from "@/lib/supabase-server";
import { createRateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const progressLimiter = createRateLimiter("route-progress", {
  burstLimit: 60,
  burstWindowMs: 60_000,
  dailyLimit: 1000,
});

const updateProgressSchema = z.object({
  action: z.enum(["toggle_entry"]),
  entry_id: z.string().uuid(),
});

/**
 * GET /api/route/[id]/progress — fetch the current user's progress through a route.
 * Returns null (204) when the user hasn't started the route yet.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const routeId = (await params).id;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({});
  }

  const { data, error } = await supabase
    .from("route_progress")
    .select("*")
    .eq("route_id", routeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? {});
}

/**
 * POST /api/route/[id]/progress — toggle an entry as watched/unwatched
 * within a route. Auto-creates the `route_progress` row on first interaction
 * and flips `completed_at` when every entry has been checked.
 *
 * Progress tracking lives on the route itself rather than piggy-backing on
 * `watch_entry` so that a user's route-progress doesn't implicitly mark the
 * underlying master-order entries as watched.
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

  const limit = progressLimiter.check(user.id);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const body: unknown = await request.json();
  const parsed = updateProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  // Fetch route to verify the entry_id belongs to it
  const { data: route } = await supabase
    .from("route")
    .select("id, entry_ids, status")
    .eq("id", routeId)
    .single();

  if (!route) {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  if (route.status !== "approved" && route.status !== "canon") {
    return NextResponse.json(
      { error: "Route is not available for tracking" },
      { status: 400 },
    );
  }

  if (!route.entry_ids.includes(parsed.data.entry_id)) {
    return NextResponse.json(
      { error: "Entry is not part of this route" },
      { status: 400 },
    );
  }

  // Upsert progress row
  const { data: existing } = await supabase
    .from("route_progress")
    .select("id, entries_completed")
    .eq("route_id", routeId)
    .eq("user_id", user.id)
    .maybeSingle();

  const current = new Set<string>(existing?.entries_completed ?? []);
  if (current.has(parsed.data.entry_id)) {
    current.delete(parsed.data.entry_id);
  } else {
    current.add(parsed.data.entry_id);
  }
  const next = Array.from(current);
  const completedAll = next.length >= route.entry_ids.length;
  const nextPosition = Math.min(next.length, route.entry_ids.length);

  if (existing) {
    await supabase
      .from("route_progress")
      .update({
        entries_completed: next,
        current_position: nextPosition,
        completed_at: completedAll ? new Date().toISOString() : null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("route_progress").insert({
      route_id: routeId,
      user_id: user.id,
      entries_completed: next,
      current_position: nextPosition,
      completed_at: completedAll ? new Date().toISOString() : null,
    });
  }

  return NextResponse.json({
    entries_completed: next,
    current_position: nextPosition,
    completed: completedAll,
    total: route.entry_ids.length,
  });
}

import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { updateWatchSchema } from "@/lib/validations/watch";
import { awardAura } from "@/lib/aura";
import { getPioneerAura } from "@/lib/pioneer";

/** GET /api/user/watch?franchise_id=X — fetch user's progress for a franchise */
export async function GET(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({});
  }

  const url = new URL(request.url);
  const franchiseId = url.searchParams.get("franchise_id");
  if (!franchiseId) {
    return NextResponse.json(
      { error: "franchise_id required" },
      { status: 400 },
    );
  }

  const { data: watchEntries, error } = await supabase
    .from("watch_entry")
    .select("entry_id, episodes_watched, status")
    .eq("user_id", user.id)
    .eq("franchise_id", franchiseId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return as Record<entryId, { episodes_watched, status }>
  const result: Record<string, { episodes_watched: number; status: string }> =
    {};
  for (const row of watchEntries ?? []) {
    result[row.entry_id] = {
      episodes_watched: row.episodes_watched,
      status: row.status,
    };
  }

  return NextResponse.json(result);
}

/** POST /api/user/watch — update watch progress */
export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateWatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { entry_id, franchise_id, action, value } = parsed.data;

  // Fetch the entry to get total episode count
  const { data: entry, error: entryError } = await supabase
    .from("entry")
    .select("id, episode_start, episode_end, entry_type")
    .eq("id", entry_id)
    .single();

  if (entryError || !entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const totalEpisodes =
    entry.entry_type === "episodes" &&
    entry.episode_start != null &&
    entry.episode_end != null
      ? entry.episode_end - entry.episode_start + 1
      : 1;

  // Fetch existing watch entry
  const { data: existing } = await supabase
    .from("watch_entry")
    .select("id, episodes_watched, status")
    .eq("user_id", user.id)
    .eq("entry_id", entry_id)
    .single();

  const prevWatched = existing?.episodes_watched ?? 0;
  let newWatched: number;
  let newStatus: string;
  let dateCompleted: string | null = null;
  let activityType: string;

  switch (action) {
    case "increment":
      newWatched = Math.min(prevWatched + 1, totalEpisodes);
      newStatus = newWatched >= totalEpisodes ? "completed" : "watching";
      if (newStatus === "completed") {
        dateCompleted = new Date().toISOString().slice(0, 10);
      }
      activityType =
        newStatus === "completed" ? "complete_entry" : "watch_episode";
      break;
    case "decrement":
      newWatched = Math.max(prevWatched - 1, 0);
      newStatus = "watching";
      activityType = "watch_episode";
      break;
    case "complete":
      newWatched = totalEpisodes;
      newStatus = "completed";
      dateCompleted = new Date().toISOString().slice(0, 10);
      activityType = "complete_entry";
      break;
    case "reset":
      newWatched = 0;
      newStatus = "watching";
      activityType = "start_watching";
      break;
    case "set":
      newWatched = Math.max(0, Math.min(value ?? 0, totalEpisodes));
      newStatus = newWatched >= totalEpisodes ? "completed" : "watching";
      if (newStatus === "completed") {
        dateCompleted = new Date().toISOString().slice(0, 10);
      }
      activityType =
        newWatched === 0
          ? "start_watching"
          : newStatus === "completed"
            ? "complete_entry"
            : "watch_episode";
      break;
  }

  // Upsert watch entry
  if (existing) {
    await supabase
      .from("watch_entry")
      .update({
        episodes_watched: newWatched,
        status: newStatus,
        date_completed: dateCompleted,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("watch_entry").insert({
      user_id: user.id,
      franchise_id,
      entry_id,
      episodes_watched: newWatched,
      status: newStatus,
      date_completed: dateCompleted,
    });
  }

  // Calculate base aura delta
  const episodesDelta = newWatched - prevWatched;
  const baseDelta = episodesDelta * 1;

  let totalAura = 0;
  let era = "initiate";

  // Track whether completion status changed for Pioneer aura
  const prevStatus = existing?.status ?? "watching";
  const becameCompleted = newStatus === "completed" && prevStatus !== "completed";
  const resetFromCompleted = newStatus !== "completed" && prevStatus === "completed";

  // Award/deduct base aura
  if (baseDelta !== 0) {
    const result = await awardAura(supabase, user.id, "aura", baseDelta);
    totalAura = result.totalAura;
    era = result.era;
  }

  // Award/deduct pioneer aura on completion status change
  let pioneerDelta = 0;
  if (becameCompleted || resetFromCompleted) {
    const { data: franchiseData } = await supabase
      .from("franchise")
      .select("obscurity_tier")
      .eq("id", franchise_id)
      .single();

    const pioneerAmount = getPioneerAura(franchiseData?.obscurity_tier ?? null);
    pioneerDelta = becameCompleted ? pioneerAmount : -pioneerAmount;
    const result = await awardAura(supabase, user.id, "pioneer", pioneerDelta);
    totalAura = result.totalAura;
    era = result.era;
  }

  // If no aura changes, still return current totals
  if (baseDelta === 0 && pioneerDelta === 0) {
    const { data: userData } = await supabase
      .from("users")
      .select("total_aura, era")
      .eq("id", user.id)
      .single();
    totalAura = userData?.total_aura ?? 0;
    era = userData?.era ?? "initiate";
  }

  // Log activity
  await supabase.from("activity").insert({
    user_id: user.id,
    type: activityType,
    franchise_id,
    entry_id,
    metadata: {
      episodes_watched: newWatched,
      total_episodes: totalEpisodes,
      base_aura: baseDelta,
      pioneer_aura: pioneerDelta,
    },
  });

  return NextResponse.json({
    watchEntry: {
      entry_id,
      episodes_watched: newWatched,
      status: newStatus,
    },
    auraAwarded: { base: baseDelta, pioneer: pioneerDelta },
    totalAura,
    era,
  });
}

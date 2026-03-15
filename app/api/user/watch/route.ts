import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { updateWatchSchema } from "@/lib/validations/watch";
import { awardAura } from "@/lib/aura";
import { getPioneerAura } from "@/lib/pioneer";
import { progressQuests } from "@/lib/quests";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Auto-add or update franchise_watchlist based on entry-level watch progress */
async function syncFranchiseWatchlist(
  supabase: SupabaseClient,
  userId: string,
  franchiseId: string,
  newEntryStatus: string,
  prevEntryStatus: string,
) {
  // Check current franchise_watchlist row
  const { data: existing } = await supabase
    .from("franchise_watchlist")
    .select("id, status")
    .eq("user_id", userId)
    .eq("franchise_id", franchiseId)
    .maybeSingle();

  // If user started watching an entry, ensure franchise is on watchlist
  if (newEntryStatus === "watching" || newEntryStatus === "completed") {
    if (!existing) {
      // Auto-add as "watching"
      await supabase.from("franchise_watchlist").insert({
        user_id: userId,
        franchise_id: franchiseId,
        status: "watching",
      });
    } else if (existing.status === "plan_to_watch") {
      // Upgrade from plan_to_watch to watching
      await supabase
        .from("franchise_watchlist")
        .update({ status: "watching", updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }
  }

  // Check if all entries are now completed
  if (newEntryStatus === "completed" && existing) {
    const { count: totalEntries } = await supabase
      .from("entry")
      .select("id", { count: "exact", head: true })
      .eq("franchise_id", franchiseId)
      .eq("is_removed", false);

    const { count: completedEntries } = await supabase
      .from("watch_entry")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("franchise_id", franchiseId)
      .eq("status", "completed");

    if (totalEntries && completedEntries && completedEntries >= totalEntries) {
      await supabase
        .from("franchise_watchlist")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("franchise_id", franchiseId);
    }
  }

  // If un-completing (was completed, now watching), revert franchise status
  if (prevEntryStatus === "completed" && newEntryStatus !== "completed" && existing?.status === "completed") {
    await supabase
      .from("franchise_watchlist")
      .update({ status: "watching", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("franchise_id", franchiseId);
  }
}

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

  // Calculate base aura delta (episodes watched + obscurity bonus on completion)
  const episodesDelta = newWatched - prevWatched;
  let auraDelta = episodesDelta * 1;

  let totalAura = 0;
  let era = "initiate";

  // Track whether completion status changed for obscurity bonus
  const prevStatus = existing?.status ?? "watching";
  const becameCompleted = newStatus === "completed" && prevStatus !== "completed";
  const resetFromCompleted = newStatus !== "completed" && prevStatus === "completed";

  // Add obscurity bonus to aura delta on completion
  let obscurityBonus = 0;
  if (becameCompleted || resetFromCompleted) {
    const { data: franchiseData } = await supabase
      .from("franchise")
      .select("obscurity_tier")
      .eq("id", franchise_id)
      .single();

    obscurityBonus = getPioneerAura(franchiseData?.obscurity_tier ?? null);
    auraDelta += becameCompleted ? obscurityBonus : -obscurityBonus;
  }

  // Award/deduct combined aura (base + obscurity bonus)
  if (auraDelta !== 0) {
    const result = await awardAura(supabase, user.id, "aura", auraDelta);
    totalAura = result.totalAura;
    era = result.era;
  }

  // If no aura changes, still return current totals
  if (auraDelta === 0) {
    const { data: userData } = await supabase
      .from("users")
      .select("total_aura, era")
      .eq("id", user.id)
      .single();
    totalAura = userData?.total_aura ?? 0;
    era = userData?.era ?? "initiate";
  }

  // Auto-manage franchise_watchlist based on entry-level progress
  await syncFranchiseWatchlist(supabase, user.id, franchise_id, newStatus, prevStatus);

  // Log activity
  await supabase.from("activity").insert({
    user_id: user.id,
    type: activityType,
    franchise_id,
    entry_id,
    metadata: {
      episodes_watched: newWatched,
      total_episodes: totalEpisodes,
      aura_awarded: auraDelta,
      obscurity_bonus: obscurityBonus,
    },
  });

  // Progress quests based on watch actions
  const completedQuests = [];
  if (episodesDelta > 0) {
    const cq = await progressQuests(supabase, user.id, "watch_episodes", episodesDelta);
    completedQuests.push(...cq);
  }
  if (becameCompleted) {
    const cq = await progressQuests(supabase, user.id, "complete_anime", 1);
    completedQuests.push(...cq);
  }

  return NextResponse.json({
    watchEntry: {
      entry_id,
      episodes_watched: newWatched,
      status: newStatus,
    },
    auraAwarded: auraDelta,
    totalAura,
    era,
    completedQuests,
  });
}

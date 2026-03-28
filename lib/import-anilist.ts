import type { SupabaseClient } from "@supabase/supabase-js";
import type { AniListUserEntry } from "@/lib/anilist";
import { awardAura } from "@/lib/aura";
import { getPioneerAura } from "@/lib/pioneer";
import { progressQuests } from "@/lib/quests";

interface AuraEntry {
  id: string;
  franchise_id: string;
  anilist_id: number;
  entry_type: string;
  episode_start: number | null;
  episode_end: number | null;
}

interface AuraFranchise {
  id: string;
  obscurity_tier: string | null;
}

interface ExistingWatch {
  entry_id: string;
  episodes_watched: number;
  status: string;
}

interface WatchUpsert {
  user_id: string;
  franchise_id: string;
  entry_id: string;
  episodes_watched: number;
  status: "watching" | "completed" | "dropped";
  date_completed: string | null;
}

interface WatchlistUpsert {
  user_id: string;
  franchise_id: string;
  status: string;
  updated_at: string;
}

export interface ImportResult {
  entries_imported: number;
  entries_skipped: number;
  franchises_updated: number;
  aura_awarded: number;
  completed_quests: { title: string; aura_amount: number }[];
  unmatched_media_ids: number[];
}

/**
 * Map AniList status → watch_entry status.
 * PLANNING is already filtered out upstream.
 */
function mapStatus(
  alStatus: AniListUserEntry["status"],
): "watching" | "completed" | "dropped" {
  switch (alStatus) {
    case "COMPLETED":
    case "REPEATING":
      return "completed";
    case "DROPPED":
      return "dropped";
    default:
      return "watching";
  }
}

/**
 * Map AniList status → franchise_watchlist status
 */
function mapWatchlistStatus(alStatus: AniListUserEntry["status"]): string {
  switch (alStatus) {
    case "COMPLETED":
    case "REPEATING":
      return "completed";
    case "CURRENT":
      return "watching";
    case "PAUSED":
      return "on_hold";
    case "DROPPED":
      return "dropped";
    default:
      return "watching";
  }
}

function formatCompletedDate(
  completedAt: AniListUserEntry["completedAt"],
): string | null {
  if (!completedAt?.year) return null;
  const y = completedAt.year;
  const m = String(completedAt.month ?? 1).padStart(2, "0");
  const d = String(completedAt.day ?? 1).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Determine if an AniList entry matches an AURA entry and compute watch state.
 *
 * Episode blocks: check progress against episode_start/episode_end.
 * Movies/OVAs/specials: check AniList status (COMPLETED/REPEATING → completed).
 */
function matchEntry(
  auraEntry: AuraEntry,
  alEntry: AniListUserEntry,
): { status: "watching" | "completed" | "dropped"; episodes_watched: number } | null {
  if (auraEntry.entry_type === "episodes") {
    const start = auraEntry.episode_start ?? 1;
    const end = auraEntry.episode_end ?? start;
    const totalEps = end - start + 1;

    if (alEntry.status === "COMPLETED" || alEntry.status === "REPEATING") {
      // AniList says completed — mark the full block
      return { status: "completed", episodes_watched: totalEps };
    }

    if (alEntry.progress >= end) {
      // Watched past this block
      return { status: "completed", episodes_watched: totalEps };
    }

    if (alEntry.progress >= start) {
      // Partially through this block
      const watched = alEntry.progress - start + 1;
      return { status: "watching", episodes_watched: watched };
    }

    // Haven't reached this block yet
    return null;
  }

  // Movies, OVAs, ONAs, specials — binary: completed or not
  const status = mapStatus(alEntry.status);
  if (status === "completed") {
    return { status: "completed", episodes_watched: 1 };
  }
  if (alEntry.status === "CURRENT" || alEntry.status === "PAUSED") {
    return { status: "watching", episodes_watched: 0 };
  }

  return null;
}

/**
 * Import a user's AniList watch history into AURA.
 *
 * - Matches AniList media IDs to AURA entries via entry.anilist_id
 * - Never overwrites existing progress that's ahead of AniList
 * - Batch upserts watch_entry and franchise_watchlist rows
 * - Awards Pioneer aura for newly completed entries
 * - Logs a single "anilist_import" activity
 * - Progresses watch_episodes + complete_anime quests
 */
export async function importFromAniList(
  supabase: SupabaseClient,
  userId: string,
  anilistEntries: AniListUserEntry[],
  dryRun = false,
): Promise<ImportResult> {
  // 1. Fetch all AURA entries with anilist_id
  const { data: auraEntries } = await supabase
    .from("entry")
    .select("id, franchise_id, anilist_id, entry_type, episode_start, episode_end")
    .not("anilist_id", "is", null);

  if (!auraEntries || auraEntries.length === 0) {
    // All entries are unmatched — sort by status priority, cap at 50
    const allIds = anilistEntries
      .map((e) => ({ mediaId: e.mediaId, priority: statusPriority(e.status) }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 50)
      .map((e) => e.mediaId);
    return {
      entries_imported: 0,
      entries_skipped: anilistEntries.length,
      franchises_updated: 0,
      aura_awarded: 0,
      completed_quests: [],
      unmatched_media_ids: allIds,
    };
  }

  // Build map: anilist_id → AuraEntry[]
  const anilistMap = new Map<number, AuraEntry[]>();
  for (const entry of auraEntries as AuraEntry[]) {
    const existing = anilistMap.get(entry.anilist_id);
    if (existing) {
      existing.push(entry);
    } else {
      anilistMap.set(entry.anilist_id, [entry]);
    }
  }

  // 2. Fetch user's existing watch_entry rows
  const { data: existingWatches } = await supabase
    .from("watch_entry")
    .select("entry_id, episodes_watched, status")
    .eq("user_id", userId);

  const existingMap = new Map<string, ExistingWatch>();
  for (const w of (existingWatches ?? []) as ExistingWatch[]) {
    existingMap.set(w.entry_id, w);
  }

  // 3. Match and build upserts
  const watchUpserts: WatchUpsert[] = [];
  const touchedFranchises = new Set<string>();
  const skippedEntries: { mediaId: number; priority: number }[] = [];
  let newlyCompletedCount = 0;
  let totalEpisodesWatched = 0;

  // Track franchise → best AniList status for watchlist
  const franchiseStatuses = new Map<string, AniListUserEntry["status"]>();

  for (const alEntry of anilistEntries) {
    const matchingEntries = anilistMap.get(alEntry.mediaId);
    if (!matchingEntries) {
      skippedEntries.push({ mediaId: alEntry.mediaId, priority: statusPriority(alEntry.status) });
      continue;
    }

    for (const auraEntry of matchingEntries) {
      const match = matchEntry(auraEntry, alEntry);
      if (!match) continue;

      // Always track franchise watchlist status, even if watch_entry is already up-to-date.
      // This ensures the franchise appears in the user's watchlist.
      touchedFranchises.add(auraEntry.franchise_id);
      const currentBest = franchiseStatuses.get(auraEntry.franchise_id);
      if (!currentBest || statusPriority(alEntry.status) > statusPriority(currentBest)) {
        franchiseStatuses.set(auraEntry.franchise_id, alEntry.status);
      }

      // Idempotency: never overwrite existing progress that's ahead
      const existing = existingMap.get(auraEntry.id);
      if (existing) {
        const existingIsCompleted = existing.status === "completed";
        const newIsCompleted = match.status === "completed";

        // If existing is already completed, skip watch_entry update
        if (existingIsCompleted) continue;

        // If existing has more episodes watched, skip
        if (existing.episodes_watched >= match.episodes_watched && !newIsCompleted) continue;
      }

      const wasCompleted = existing?.status === "completed";
      const nowCompleted = match.status === "completed";

      if (nowCompleted && !wasCompleted) {
        newlyCompletedCount++;
      }

      totalEpisodesWatched += match.episodes_watched - (existing?.episodes_watched ?? 0);

      watchUpserts.push({
        user_id: userId,
        franchise_id: auraEntry.franchise_id,
        entry_id: auraEntry.id,
        episodes_watched: match.episodes_watched,
        status: match.status,
        date_completed:
          match.status === "completed" ? formatCompletedDate(alEntry.completedAt) : null,
      });
    }
  }

  // Sort skipped by status priority (COMPLETED first), cap at 50
  const unmatchedMediaIds = skippedEntries
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 50)
    .map((e) => e.mediaId);

  if (dryRun) {
    return {
      entries_imported: watchUpserts.length,
      entries_skipped: skippedEntries.length,
      franchises_updated: touchedFranchises.size,
      aura_awarded: 0,
      completed_quests: [],
      unmatched_media_ids: unmatchedMediaIds,
    };
  }

  // 4. Batch upsert watch_entry rows (chunks of 200)
  for (let i = 0; i < watchUpserts.length; i += 200) {
    const chunk = watchUpserts.slice(i, i + 200);
    await supabase.from("watch_entry").upsert(chunk, {
      onConflict: "user_id,entry_id",
    });
  }

  // 5. Batch upsert franchise_watchlist rows
  // Fetch existing watchlist to avoid downgrading status
  const franchiseIds = Array.from(touchedFranchises);
  const { data: existingWatchlist } = await supabase
    .from("franchise_watchlist")
    .select("franchise_id, status")
    .eq("user_id", userId)
    .in("franchise_id", franchiseIds);

  const existingWatchlistMap = new Map<string, string>();
  for (const w of existingWatchlist ?? []) {
    existingWatchlistMap.set(w.franchise_id, w.status);
  }

  const now = new Date().toISOString();
  const watchlistUpserts: WatchlistUpsert[] = [];
  for (const [franchiseId, alStatus] of franchiseStatuses) {
    const newStatus = mapWatchlistStatus(alStatus);
    const existingStatus = existingWatchlistMap.get(franchiseId);

    // Don't downgrade: if already completed, keep it
    if (existingStatus && watchlistStatusPriority(existingStatus) >= watchlistStatusPriority(newStatus)) {
      continue;
    }

    watchlistUpserts.push({
      user_id: userId,
      franchise_id: franchiseId,
      status: newStatus,
      updated_at: now,
    });
  }

  for (let i = 0; i < watchlistUpserts.length; i += 200) {
    const chunk = watchlistUpserts.slice(i, i + 200);
    await supabase.from("franchise_watchlist").upsert(chunk, {
      onConflict: "user_id,franchise_id",
    });
  }

  // 6. Award Pioneer aura for newly completed entries
  let totalAuraAwarded = 0;
  if (newlyCompletedCount > 0) {
    // Fetch obscurity tiers for touched franchises
    const { data: franchises } = await supabase
      .from("franchise")
      .select("id, obscurity_tier")
      .in("id", franchiseIds);

    const tierMap = new Map<string, string | null>();
    for (const f of (franchises ?? []) as AuraFranchise[]) {
      tierMap.set(f.id, f.obscurity_tier);
    }

    // Sum pioneer aura per completed entry's franchise tier
    let pioneerDelta = 0;
    for (const upsert of watchUpserts) {
      if (upsert.status === "completed") {
        const existing = existingMap.get(upsert.entry_id);
        if (existing?.status === "completed") continue; // was already completed
        const tier = tierMap.get(upsert.franchise_id) ?? null;
        pioneerDelta += getPioneerAura(tier);
      }
    }

    if (pioneerDelta > 0) {
      await awardAura(supabase, userId, "aura", pioneerDelta);
      totalAuraAwarded = pioneerDelta;
    }
  }

  // 7. Log single activity
  await supabase.from("activity").insert({
    user_id: userId,
    type: "anilist_import",
    metadata: {
      entries_imported: watchUpserts.length,
      franchises_updated: touchedFranchises.size,
      aura_awarded: totalAuraAwarded,
    },
  });

  // 8. Progress quests in bulk
  const completedQuests: ImportResult["completed_quests"] = [];

  if (totalEpisodesWatched > 0) {
    const epQuests = await progressQuests(
      supabase,
      userId,
      "watch_episodes",
      totalEpisodesWatched,
    );
    for (const q of epQuests) {
      completedQuests.push({ title: q.title, aura_amount: q.aura_amount });
    }
  }

  if (newlyCompletedCount > 0) {
    const compQuests = await progressQuests(
      supabase,
      userId,
      "complete_anime",
      newlyCompletedCount,
    );
    for (const q of compQuests) {
      completedQuests.push({ title: q.title, aura_amount: q.aura_amount });
    }
  }

  return {
    entries_imported: watchUpserts.length,
    entries_skipped: skippedEntries.length,
    franchises_updated: touchedFranchises.size,
    aura_awarded: totalAuraAwarded,
    completed_quests: completedQuests,
    unmatched_media_ids: unmatchedMediaIds,
  };
}

/** Higher = "more important" AniList status for per-franchise tracking */
function statusPriority(status: AniListUserEntry["status"]): number {
  switch (status) {
    case "COMPLETED":
    case "REPEATING":
      return 4;
    case "CURRENT":
      return 3;
    case "PAUSED":
      return 2;
    case "DROPPED":
      return 1;
    default:
      return 0;
  }
}

/** Priority for franchise_watchlist statuses — prevents downgrading */
function watchlistStatusPriority(status: string): number {
  switch (status) {
    case "completed":
      return 4;
    case "watching":
      return 3;
    case "on_hold":
      return 2;
    case "dropped":
      return 1;
    case "plan_to_watch":
      return 0;
    default:
      return -1;
  }
}

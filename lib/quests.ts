import type { SupabaseClient } from "@supabase/supabase-js";
import type { QuestConditionType, QuestWithProgress, QuestCategory } from "@/types/quest";
import { awardAura } from "@/lib/aura";
import type { AuraType } from "@/types/aura";

/** Returned when a quest is auto-completed during progressQuests */
export interface CompletedQuest {
  title: string;
  aura_type: string;
  aura_amount: number;
}

/** Returns ISO week key like '2026-W11' */
export function getCurrentWeekKey(): string {
  const now = new Date();
  // ISO week calculation
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Ensures user_quest rows exist for all weekly quests in the current week.
 * Lazy initialization — called on read, no cron needed.
 */
export async function ensureWeeklyQuests(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const weekKey = getCurrentWeekKey();

  // Check if any weekly rows exist for this week
  const { data: existing } = await supabase
    .from("user_quest")
    .select("id")
    .eq("user_id", userId)
    .eq("week_key", weekKey)
    .limit(1);

  if (existing && existing.length > 0) return;

  // Fetch all weekly quest definitions
  const { data: weeklyQuests } = await supabase
    .from("quest")
    .select("id")
    .eq("category", "weekly");

  if (!weeklyQuests || weeklyQuests.length === 0) return;

  // Insert fresh user_quest rows for this week
  const rows = weeklyQuests.map((q: { id: string }) => ({
    user_id: userId,
    quest_id: q.id,
    progress: 0,
    week_key: weekKey,
  }));

  await supabase.from("user_quest").insert(rows);
}

/**
 * Ensures the first incomplete journey quest has a user_quest row.
 * Journey quests are sequential — one at a time.
 */
export async function ensureJourneyQuests(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Fetch all journey quests ordered by sort_order
  const { data: journeyQuests } = await supabase
    .from("quest")
    .select("id, sort_order")
    .eq("category", "journey")
    .order("sort_order", { ascending: true });

  if (!journeyQuests || journeyQuests.length === 0) return;

  // Fetch existing user_quest rows for journey quests
  const questIds = journeyQuests.map((q: { id: string }) => q.id);
  const { data: userQuests } = await supabase
    .from("user_quest")
    .select("quest_id, completed_at")
    .eq("user_id", userId)
    .in("quest_id", questIds);

  const completedSet = new Set(
    (userQuests ?? [])
      .filter((uq: { completed_at: string | null }) => uq.completed_at)
      .map((uq: { quest_id: string }) => uq.quest_id),
  );
  const hasRowSet = new Set(
    (userQuests ?? []).map((uq: { quest_id: string }) => uq.quest_id),
  );

  // Find first journey quest that isn't completed
  for (const quest of journeyQuests) {
    if (!completedSet.has(quest.id)) {
      // Ensure it has a user_quest row
      if (!hasRowSet.has(quest.id)) {
        await supabase.from("user_quest").insert({
          user_id: userId,
          quest_id: quest.id,
          progress: 0,
          week_key: null,
        });
      }
      break;
    }
  }
}

/**
 * Progress quests matching a condition type.
 * Called from API routes when users take actions.
 *
 * Auto-completes quests and awards aura when target is met.
 */
export async function progressQuests(
  supabase: SupabaseClient,
  userId: string,
  conditionType: QuestConditionType,
  delta: number = 1,
): Promise<CompletedQuest[]> {
  const weekKey = getCurrentWeekKey();
  const completed: CompletedQuest[] = [];

  // Find all quest definitions matching this condition type
  const { data: matchingQuests } = await supabase
    .from("quest")
    .select("id, title, condition, target, aura_type, aura_amount, category")
    .filter("condition->>type", "eq", conditionType);

  if (!matchingQuests || matchingQuests.length === 0) return completed;

  for (const quest of matchingQuests) {
    // For weekly quests, match on current week_key; others have week_key = null
    const isWeekly = quest.category === "weekly";

    // Find the user_quest row
    let query = supabase
      .from("user_quest")
      .select("id, progress, completed_at")
      .eq("user_id", userId)
      .eq("quest_id", quest.id);

    if (isWeekly) {
      query = query.eq("week_key", weekKey);
    } else {
      query = query.is("week_key", null);
    }

    const { data: userQuest } = await query.single();

    // Skip if no user_quest row exists (quest not active for this user)
    if (!userQuest) continue;

    // Skip if already completed
    if (userQuest.completed_at) continue;

    // Increment progress
    const newProgress = Math.min(userQuest.progress + delta, quest.target);

    const updateData: Record<string, unknown> = { progress: newProgress };

    // Auto-complete if target met
    if (newProgress >= quest.target) {
      updateData.completed_at = new Date().toISOString();
      updateData.aura_awarded = quest.aura_amount;

      // Award aura
      await awardAura(
        supabase,
        userId,
        quest.aura_type as AuraType,
        quest.aura_amount,
      );

      completed.push({
        title: quest.title,
        aura_type: quest.aura_type,
        aura_amount: quest.aura_amount,
      });
    }

    await supabase
      .from("user_quest")
      .update(updateData)
      .eq("id", userQuest.id);
  }

  return completed;
}

/**
 * Fetch quests joined with user progress.
 * Used by the GET /api/quest route.
 */
export async function getUserQuests(
  supabase: SupabaseClient,
  userId: string,
  category?: QuestCategory,
): Promise<QuestWithProgress[]> {
  // Ensure lazy-init for weekly and journey quests
  await ensureWeeklyQuests(supabase, userId);
  await ensureJourneyQuests(supabase, userId);

  const weekKey = getCurrentWeekKey();

  // Build quest query
  let questQuery = supabase
    .from("quest")
    .select("*")
    .order("sort_order", { ascending: true });

  if (category) {
    questQuery = questQuery.eq("category", category);
  }

  const { data: quests } = await questQuery;
  if (!quests || quests.length === 0) return [];

  // Fetch all user_quest rows for this user
  const questIds = quests.map((q: { id: string }) => q.id);
  const { data: userQuests } = await supabase
    .from("user_quest")
    .select("quest_id, progress, completed_at, week_key")
    .eq("user_id", userId)
    .in("quest_id", questIds);

  // Build lookup: quest_id -> user_quest (accounting for week_key)
  const uqMap = new Map<string, { progress: number; completed_at: string | null }>();
  for (const uq of userQuests ?? []) {
    // For weekly quests, only consider current week
    if (uq.week_key && uq.week_key !== weekKey) continue;
    uqMap.set(uq.quest_id, { progress: uq.progress, completed_at: uq.completed_at });
  }

  return quests.map((quest: {
    id: string;
    title: string;
    flavour_text: string | null;
    description: string;
    aura_type: string;
    aura_amount: number;
    target: number;
    category: string;
    is_hidden: boolean;
    era_required: string | null;
  }) => {
    const uq = uqMap.get(quest.id);

    // Hidden mastery quests without a user_quest row are unrevealed
    const revealed = quest.is_hidden ? !!uq : true;

    return {
      id: quest.id,
      title: quest.title,
      flavour_text: quest.flavour_text,
      description: quest.description,
      aura_type: quest.aura_type,
      aura_amount: quest.aura_amount,
      target: quest.target,
      category: quest.category,
      is_hidden: quest.is_hidden,
      era_required: quest.era_required,
      progress: uq?.progress ?? 0,
      completed: !!uq?.completed_at,
      revealed,
    } as QuestWithProgress;
  });
}

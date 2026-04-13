import type { SupabaseClient } from "@supabase/supabase-js";
import { ERA_THRESHOLDS, type Era } from "@/types/aura";
import { getEraForTotal } from "@/lib/aura";

export type EraUnlock = "propose" | "franchise" | "route";

/**
 * Copy for what each era unlocks. Single source of truth — used by gate
 * modals, progress bars, and API error messages.
 */
export const ERA_UNLOCKS: Record<EraUnlock, { label: string; minAura: number; era: Era }> = {
  propose: {
    label: "Propose edits to watch orders",
    minAura: ERA_THRESHOLDS.wanderer.min,
    era: "wanderer",
  },
  franchise: {
    label: "Create new franchise pages",
    minAura: ERA_THRESHOLDS.wanderer.min,
    era: "wanderer",
  },
  route: {
    label: "Create curated routes",
    minAura: ERA_THRESHOLDS.wanderer.min,
    era: "wanderer",
  },
};

/**
 * Server-side era gate helper. Reads total_aura from the users table.
 * Use in API routes instead of inlining the check.
 *
 * Returns:
 *  - ok: true if user has enough Aura
 *  - totalAura: their current total
 *  - era: their current era
 *  - needed: how many more Aura points they need (0 if already eligible)
 */
export async function requireEra(
  supabase: SupabaseClient,
  userId: string,
  minAura: number,
): Promise<{ ok: boolean; totalAura: number; era: Era; needed: number }> {
  const { data: profile } = await supabase
    .from("users")
    .select("total_aura")
    .eq("id", userId)
    .single();

  const totalAura = profile?.total_aura ?? 0;
  const era = getEraForTotal(totalAura);
  const needed = Math.max(0, minAura - totalAura);

  return {
    ok: totalAura >= minAura,
    totalAura,
    era,
    needed,
  };
}

interface EraProgress {
  era: Era;
  next: Era | null;
  progressToNext: number; // 0..1
  auraToNext: number;
  currentAura: number;
  nextThreshold: number | null;
}

/**
 * Pure UI helper — given an Aura total, derive era + progress toward next era.
 * Used by EraProgressBar and EraGateModal.
 */
export function eraForAura(total: number): EraProgress {
  const current = getEraForTotal(total);

  const ERA_ORDER: Era[] = ["initiate", "wanderer", "adept", "ascendant"];
  const idx = ERA_ORDER.indexOf(current);
  const next = idx < ERA_ORDER.length - 1 ? ERA_ORDER[idx + 1] : null;

  if (!next) {
    return {
      era: current,
      next: null,
      progressToNext: 1,
      auraToNext: 0,
      currentAura: total,
      nextThreshold: null,
    };
  }

  const currentThreshold = ERA_THRESHOLDS[current].min;
  const nextThreshold = ERA_THRESHOLDS[next].min;
  const span = nextThreshold - currentThreshold;
  const into = Math.max(0, total - currentThreshold);
  const progressToNext = span > 0 ? Math.min(1, into / span) : 1;
  const auraToNext = Math.max(0, nextThreshold - total);

  return {
    era: current,
    next,
    progressToNext,
    auraToNext,
    currentAura: total,
    nextThreshold,
  };
}

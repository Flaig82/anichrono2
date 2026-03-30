import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuraType } from "@/types/aura";
import { ERA_THRESHOLDS, type Era } from "@/types/aura";
import { createNotification } from "@/lib/notifications";

const ERA_DISPLAY: Record<Era, string> = {
  initiate: "Initiate",
  wanderer: "Wanderer",
  adept: "Adept",
  ascendant: "Ascendant",
};

/** Determine era from total aura score */
export function getEraForTotal(total: number): Era {
  if (total >= ERA_THRESHOLDS.ascendant.min) return "ascendant";
  if (total >= ERA_THRESHOLDS.adept.min) return "adept";
  if (total >= ERA_THRESHOLDS.wanderer.min) return "wanderer";
  return "initiate";
}

/**
 * Upsert aura for a user, recalculate total_aura, and check era promotion.
 * Returns the new total aura and era.
 */
export async function awardAura(
  supabase: SupabaseClient,
  userId: string,
  auraType: AuraType,
  delta: number,
): Promise<{ totalAura: number; era: Era }> {
  // Fetch existing aura row for this type
  const { data: existing } = await supabase
    .from("user_aura")
    .select("id, value")
    .eq("user_id", userId)
    .eq("aura_type", auraType)
    .single();

  if (existing) {
    const newValue = Math.max(0, existing.value + delta);
    await supabase
      .from("user_aura")
      .update({
        value: newValue,
        last_calculated: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("user_aura").insert({
      user_id: userId,
      aura_type: auraType,
      value: Math.max(0, delta),
      last_calculated: new Date().toISOString(),
    });
  }

  // Fetch previous era before recalculating
  const { data: prevUser } = await supabase
    .from("users")
    .select("era")
    .eq("id", userId)
    .single();
  const previousEra = (prevUser?.era as Era) ?? "initiate";

  // Recalculate total across all aura types
  const { data: allAura } = await supabase
    .from("user_aura")
    .select("value")
    .eq("user_id", userId);

  const totalAura = allAura
    ? allAura.reduce((sum: number, a: { value: number }) => sum + a.value, 0)
    : 0;

  const era = getEraForTotal(totalAura);

  // Update user record
  await supabase
    .from("users")
    .update({ total_aura: totalAura, era })
    .eq("id", userId);

  // Create era promotion notification if era changed
  if (era !== previousEra) {
    createNotification({
      userId,
      type: "era_promotion",
      message: `You reached ${ERA_DISPLAY[era]} era!`,
    }).catch(() => {});
  }

  return { totalAura, era };
}

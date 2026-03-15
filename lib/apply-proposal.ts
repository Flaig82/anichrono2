import { createServiceClient } from "@/lib/supabase-service";
import { awardAura } from "@/lib/aura";

/**
 * Applies a proposal: replaces franchise entries with proposed entries,
 * marks the proposal as applied, and awards Archivist Aura.
 */
export async function applyProposal(
  proposalId: string,
  franchiseId: string,
  proposedEntries: unknown,
  authorId: string,
) {
  const service = createServiceClient();

  // Build proposed entries list (strip editor-only fields)
  const entries = (proposedEntries as Array<Record<string, unknown>>).map(
    (e) => ({
      id: e.id as string,
      franchise_id: franchiseId,
      position: e.position,
      title: e.title,
      entry_type: e.entry_type,
      episode_start: e.episode_start,
      episode_end: e.episode_end,
      parent_series: e.parent_series,
      anilist_id: e.anilist_id,
      is_essential: e.is_essential,
      curator_note: e.curator_note,
      cover_image_url: e.cover_image_url,
      is_removed: false,
    }),
  );

  const proposedIds = entries.map((e) => e.id);

  // Soft-delete entries not in the proposed list
  await service
    .from("entry")
    .update({ is_removed: true })
    .eq("franchise_id", franchiseId)
    .not("id", "in", `(${proposedIds.join(",")})`);

  // Upsert proposed entries (updates existing, inserts new, resets is_removed)
  await service.from("entry").upsert(entries);

  // Mark proposal as applied
  await service
    .from("order_proposal")
    .update({
      status: "applied",
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  // Award 200 Archivist Aura to the author
  await awardAura(service, authorId, "archivist", 200);
}

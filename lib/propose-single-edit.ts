import type { EntryData } from "@/types/proposal";
import type { CreateProposalInput } from "@/lib/validations/proposal";

/**
 * Build a proposal payload that changes exactly one entry's `curator_note`,
 * leaving every other field identical to the current master order.
 *
 * The `order_proposal.proposed_entries` column stores a FULL SNAPSHOT of the
 * entries array (not a diff), so a "just add a note" inline action still has
 * to submit the whole list. This helper keeps that complexity out of the
 * popover UI and guarantees that only the target entry's note is modified.
 *
 * The server runs no-op detection to reject trivially identical submissions —
 * so callers should always check that `newNote !== entry.curator_note` first,
 * but this helper doesn't error on a duplicate (that's the server's job).
 */
export function buildSingleNoteProposal(
  allEntries: EntryData[],
  entryId: string,
  newNote: string | null,
  entryTitle: string,
): CreateProposalInput {
  const cleanedEntries: EntryData[] = allEntries.map((entry) => ({
    id: entry.id,
    franchise_id: entry.franchise_id,
    position: entry.position,
    title: entry.title,
    entry_type: entry.entry_type,
    episode_start: entry.episode_start,
    episode_end: entry.episode_end,
    parent_series: entry.parent_series,
    anilist_id: entry.anilist_id,
    is_essential: entry.is_essential,
    curator_note:
      entry.id === entryId
        ? newNote && newNote.trim().length > 0
          ? newNote.trim()
          : null
        : entry.curator_note,
    cover_image_url: entry.cover_image_url,
  }));

  return {
    title: `Note: ${entryTitle}`.slice(0, 100),
    description: null,
    proposed_entries: cleanedEntries,
  };
}

/**
 * Pure equality check on the shape that `createProposalSchema` cares about.
 * Used client-side to prevent obvious no-op submits before hitting the API,
 * and used server-side as the authoritative no-op detector.
 */
export function entriesEqual(a: EntryData[], b: EntryData[]): boolean {
  if (a.length !== b.length) return false;
  const key = (e: EntryData) =>
    JSON.stringify([
      e.id,
      e.position,
      e.title,
      e.entry_type,
      e.episode_start,
      e.episode_end,
      e.parent_series,
      e.anilist_id,
      e.is_essential,
      e.curator_note,
      e.cover_image_url,
    ]);
  // Compare position-by-position, not by id lookup, so reorderings count.
  for (let i = 0; i < a.length; i++) {
    const aEntry = a[i];
    const bEntry = b[i];
    if (!aEntry || !bEntry) return false;
    if (key(aEntry) !== key(bEntry)) return false;
  }
  return true;
}

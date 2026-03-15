import type { EntryData, DiffResult, DiffStatus } from "@/types/proposal";

/**
 * Compares current entries against proposed entries and produces a diff.
 * Uses entry IDs for matching. New entries (temp UUIDs) show as "added".
 */
export function diffEntries(
  current: EntryData[],
  proposed: EntryData[],
): DiffResult[] {
  const currentMap = new Map(current.map((e) => [e.id, e]));
  const proposedMap = new Map(proposed.map((e) => [e.id, e]));
  const results: DiffResult[] = [];

  // Check proposed entries for adds, moves, changes
  for (const entry of proposed) {
    const original = currentMap.get(entry.id);

    if (!original) {
      results.push({ entry, status: "added" });
      continue;
    }

    const changes: string[] = [];
    if (original.title !== entry.title) changes.push("title");
    if (original.entry_type !== entry.entry_type) changes.push("type");
    if (original.episode_start !== entry.episode_start) changes.push("episode range");
    if (original.episode_end !== entry.episode_end) changes.push("episode range");
    if (original.parent_series !== entry.parent_series) changes.push("series");
    if (original.curator_note !== entry.curator_note) changes.push("note");
    if (original.is_essential !== entry.is_essential) changes.push("essential flag");

    const moved = original.position !== entry.position;
    const changed = changes.length > 0;

    if (changed && moved) {
      results.push({
        entry,
        status: "changed",
        previousPosition: original.position,
        changes,
      });
    } else if (moved) {
      results.push({
        entry,
        status: "moved",
        previousPosition: original.position,
      });
    } else if (changed) {
      results.push({ entry, status: "changed", changes });
    } else {
      results.push({ entry, status: "unchanged" });
    }
  }

  // Check for removed entries (in current but not in proposed)
  for (const entry of current) {
    if (!proposedMap.has(entry.id)) {
      results.push({ entry, status: "removed" });
    }
  }

  return results;
}

/** Returns true if there are any meaningful changes */
export function hasDiff(results: DiffResult[]): boolean {
  return results.some((r) => r.status !== "unchanged");
}

/** Counts changes by type */
export function diffSummary(results: DiffResult[]): Record<DiffStatus, number> {
  const counts: Record<DiffStatus, number> = {
    added: 0,
    removed: 0,
    moved: 0,
    changed: 0,
    unchanged: 0,
  };
  for (const r of results) {
    counts[r.status]++;
  }
  return counts;
}

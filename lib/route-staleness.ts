/**
 * Route staleness detection — compares a chronicle's entry_ids against the
 * current master order to determine what's changed since the route was
 * created or last reconciled.
 *
 * "Stale" means the master order has entries that the route doesn't reference
 * (new entries added) or the route references entries that no longer exist in
 * the master (entries removed). Both signal the route may need updating.
 *
 * This is a pure function — no DB calls. The caller provides both arrays.
 */

export interface StalenessInfo {
  /** Total entries in master that aren't in this route's entry_ids */
  newInMaster: number;
  /** Entries in this route's entry_ids that no longer exist in master (removed/soft-deleted) */
  removedFromMaster: number;
  /** True if either count > 0 */
  isStale: boolean;
  /** Human-readable summary: "3 entries behind main" or "Up to date" */
  label: string;
}

/**
 * @param routeEntryIds  The route's `entry_ids` uuid[] array
 * @param masterEntryIds All active entry IDs from the franchise's master order
 *                       (where is_removed = false), in position order
 */
export function computeStaleness(
  routeEntryIds: string[],
  masterEntryIds: string[],
): StalenessInfo {
  const routeSet = new Set(routeEntryIds);
  const masterSet = new Set(masterEntryIds);

  // New entries in master that the route doesn't include
  const newInMaster = masterEntryIds.filter((id) => !routeSet.has(id)).length;

  // Route references entries that master no longer has
  const removedFromMaster = routeEntryIds.filter(
    (id) => !masterSet.has(id),
  ).length;

  const isStale = newInMaster > 0 || removedFromMaster > 0;

  let label = "Up to date";
  if (newInMaster > 0 && removedFromMaster > 0) {
    label = `${newInMaster} new + ${removedFromMaster} removed since creation`;
  } else if (newInMaster > 0) {
    label = `${newInMaster} ${newInMaster === 1 ? "entry" : "entries"} behind main`;
  } else if (removedFromMaster > 0) {
    label = `${removedFromMaster} orphaned ${removedFromMaster === 1 ? "entry" : "entries"}`;
  }

  return { newInMaster, removedFromMaster, isStale, label };
}

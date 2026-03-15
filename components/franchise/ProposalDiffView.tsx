"use client";

import { diffEntries, diffSummary, hasDiff } from "@/lib/diff-entries";
import type { EntryData } from "@/types/proposal";
import DiffEntryRow from "./DiffEntryRow";

interface ProposalDiffViewProps {
  currentEntries: EntryData[];
  proposedEntries: EntryData[];
}

export default function ProposalDiffView({
  currentEntries,
  proposedEntries,
}: ProposalDiffViewProps) {
  const results = diffEntries(currentEntries, proposedEntries);
  const summary = diffSummary(results);
  const hasChanges = hasDiff(results);

  if (!hasChanges) {
    return (
      <p className="py-4 text-center font-body text-sm text-aura-muted2">
        No changes detected
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 font-body text-[11px]">
        {summary.added > 0 && (
          <span className="text-emerald-400">+{summary.added} added</span>
        )}
        {summary.removed > 0 && (
          <span className="text-red-400">-{summary.removed} removed</span>
        )}
        {summary.moved > 0 && (
          <span className="text-blue-400">{summary.moved} moved</span>
        )}
        {summary.changed > 0 && (
          <span className="text-amber-400">{summary.changed} changed</span>
        )}
      </div>

      {/* Diff rows */}
      <div className="flex flex-col gap-1">
        {results
          .filter((r) => r.status !== "unchanged")
          .map((diff) => (
            <DiffEntryRow key={`${diff.entry.id}-${diff.status}`} diff={diff} />
          ))}
      </div>

      {/* Unchanged count */}
      {summary.unchanged > 0 && (
        <p className="font-body text-[11px] text-aura-muted">
          {summary.unchanged} entries unchanged
        </p>
      )}
    </div>
  );
}

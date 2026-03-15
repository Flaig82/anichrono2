"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import type { EntryData, EditorEntry } from "@/types/proposal";
import type { EntryType } from "@/types/franchise";
import type { RelationDropData } from "./EditableEntryList";
import { diffEntries, hasDiff } from "@/lib/diff-entries";
import EditableEntryList from "./EditableEntryList";
import OrderEditorToolbar from "./OrderEditorToolbar";
import SubmitProposalDialog from "./SubmitProposalDialog";

interface EditorGroup {
  parentSeries: string;
  coverImageUrl: string | null;
  entries: EditorEntry[];
  /** Global index of the first entry in this group */
  startIndex: number;
}

interface OrderEditorProps {
  franchiseId: string;
  initialEntries: EntryData[];
  franchiseCoverImageUrl?: string | null;
  onCancel: () => void;
  onSubmitSuccess: () => void;
  onAnilistIdsChange?: (ids: Set<number>) => void;
}

const TYPE_LABELS: Record<string, string> = {
  episodes: "TV Series",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  special: "Special",
};

export default function OrderEditor({
  franchiseId,
  initialEntries,
  franchiseCoverImageUrl,
  onCancel,
  onSubmitSuccess,
  onAnilistIdsChange,
}: OrderEditorProps) {
  const [entries, setEntries] = useState<EditorEntry[]>(() =>
    initialEntries.map((e) => ({ ...e })),
  );
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [splitTarget, setSplitTarget] = useState<string | null>(null);
  const [splitPoint, setSplitPoint] = useState("");

  const diffResults = diffEntries(initialEntries, entries);
  const hasChanges = hasDiff(diffResults);

  // Report current anilist_ids to parent for sidebar state
  useEffect(() => {
    if (!onAnilistIdsChange) return;
    const ids = new Set<number>();
    for (const e of entries) {
      if (e.anilist_id != null) ids.add(e.anilist_id);
    }
    onAnilistIdsChange(ids);
  }, [entries, onAnilistIdsChange]);

  // Group entries by parent_series for visual sections
  const groups = useMemo(() => {
    const result: EditorGroup[] = [];
    let currentGroup: EditorGroup | null = null;
    let globalIndex = 0;

    for (const entry of entries) {
      const series = entry.parent_series ?? "Unknown";

      if (!currentGroup || currentGroup.parentSeries !== series) {
        currentGroup = {
          parentSeries: series,
          coverImageUrl:
            entry.cover_image_url ?? franchiseCoverImageUrl ?? null,
          entries: [],
          startIndex: globalIndex,
        };
        result.push(currentGroup);
      }

      currentGroup.entries.push(entry);
      // Update cover if we find one in this group
      if (entry.cover_image_url && !currentGroup.coverImageUrl) {
        currentGroup.coverImageUrl = entry.cover_image_url;
      }
      globalIndex++;
    }

    return result;
  }, [entries, franchiseCoverImageUrl]);

  // Recalculate positions after any change
  function recalcPositions(list: EditorEntry[]): EditorEntry[] {
    return list.map((e, i) => ({ ...e, position: i + 1 }));
  }

  // Reorder via drag
  const handleReorder = useCallback((newOrder: EditorEntry[]) => {
    setEntries(recalcPositions(newOrder));
  }, []);

  // Update a field on an entry
  const handleUpdate = useCallback(
    (id: string, partial: Partial<EditorEntry>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...partial } : e)),
      );
    },
    [],
  );

  // Delete an entry
  const handleDelete = useCallback((id: string) => {
    setEntries((prev) => recalcPositions(prev.filter((e) => e.id !== id)));
  }, []);

  // Insert a relation from sidebar drop at a specific position
  const handleInsertAt = useCallback(
    (index: number, data: RelationDropData) => {
      const nearbyEntry = entries[Math.max(0, index - 1)];
      const newEntry: EditorEntry = {
        id: crypto.randomUUID(),
        franchise_id: franchiseId,
        position: index + 1,
        title: data.title,
        entry_type: data.entry_type as EntryType,
        episode_start: data.entry_type === "episodes" ? 1 : null,
        episode_end:
          data.entry_type === "episodes" ? (data.episodes ?? null) : null,
        parent_series: nearbyEntry?.parent_series ?? null,
        anilist_id: data.anilist_id,
        is_essential: true,
        curator_note: null,
        cover_image_url: data.cover_image_url,
        _isNew: true,
      };

      setEntries((prev) => {
        const next = [...prev];
        next.splice(index, 0, newEntry);
        return recalcPositions(next);
      });
    },
    [entries, franchiseId],
  );

  // Insert a blank entry at a specific position (from between-row button)
  const handleInsertBlankAt = useCallback(
    (index: number) => {
      const nearbyEntry = entries[Math.max(0, index - 1)];
      const newEntry: EditorEntry = {
        id: crypto.randomUUID(),
        franchise_id: franchiseId,
        position: index + 1,
        title: "",
        entry_type: "episodes",
        episode_start: null,
        episode_end: null,
        parent_series: nearbyEntry?.parent_series ?? null,
        anilist_id: null,
        is_essential: true,
        curator_note: null,
        cover_image_url: null,
        _isNew: true,
      };

      setEntries((prev) => {
        const next = [...prev];
        next.splice(index, 0, newEntry);
        return recalcPositions(next);
      });
    },
    [entries, franchiseId],
  );

  // Add a new blank entry at the end (inherits last group)
  function handleAddEntry() {
    const newEntry: EditorEntry = {
      id: crypto.randomUUID(),
      franchise_id: franchiseId,
      position: entries.length + 1,
      title: "",
      entry_type: "episodes",
      episode_start: null,
      episode_end: null,
      parent_series: entries[entries.length - 1]?.parent_series ?? null,
      anilist_id: null,
      is_essential: true,
      curator_note: null,
      cover_image_url: null,
      _isNew: true,
    };
    setEntries((prev) => [...prev, newEntry]);
  }

  // Add a new group with a blank entry
  function handleAddGroup() {
    const newEntry: EditorEntry = {
      id: crypto.randomUUID(),
      franchise_id: franchiseId,
      position: entries.length + 1,
      title: "",
      entry_type: "episodes",
      episode_start: null,
      episode_end: null,
      parent_series: "New Series",
      anilist_id: null,
      is_essential: true,
      curator_note: null,
      cover_image_url: null,
      _isNew: true,
    };
    setEntries((prev) => [...prev, newEntry]);
  }

  // Split an episode block at a given point
  function handleSplitRequest(id: string) {
    setSplitTarget(id);
    setSplitPoint("");
  }

  function confirmSplit() {
    if (!splitTarget) return;
    const point = parseInt(splitPoint, 10);
    if (isNaN(point)) return;

    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === splitTarget);
      if (idx === -1) return prev;

      const entry = prev[idx]!;
      if (
        entry.episode_start == null ||
        entry.episode_end == null ||
        point <= entry.episode_start ||
        point > entry.episode_end
      ) {
        return prev;
      }

      const firstHalf: EditorEntry = {
        ...entry,
        episode_end: point - 1,
        title: `Episodes ${entry.episode_start}–${point - 1}`,
        _isModified: true,
      };

      const secondHalf: EditorEntry = {
        ...entry,
        id: crypto.randomUUID(),
        episode_start: point,
        title: `Episodes ${point}–${entry.episode_end}`,
        _isNew: true,
      };

      const newList = [...prev];
      newList.splice(idx, 1, firstHalf, secondHalf);
      return recalcPositions(newList);
    });

    setSplitTarget(null);
    setSplitPoint("");
  }

  function cancelSplit() {
    setSplitTarget(null);
    setSplitPoint("");
  }

  const splitEntry = splitTarget
    ? entries.find((e) => e.id === splitTarget)
    : null;

  // If we have multiple groups, render grouped; otherwise flat
  const hasGroups = groups.length > 1 || (groups.length === 1 && groups[0]!.parentSeries !== "Unknown");

  return (
    <div className="flex flex-col gap-4">
      <OrderEditorToolbar
        onAddEntry={handleAddEntry}
        onCancel={onCancel}
        onSubmit={() => setShowSubmitDialog(true)}
        hasChanges={hasChanges}
        entryCount={entries.length}
      />

      {/* Split dialog (inline) */}
      {splitTarget && splitEntry && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
          <span className="font-body text-[13px] text-white">
            Split &ldquo;{splitEntry.title}&rdquo; at episode:
          </span>
          <input
            type="number"
            value={splitPoint}
            onChange={(e) => setSplitPoint(e.target.value)}
            min={(splitEntry.episode_start ?? 0) + 1}
            max={splitEntry.episode_end ?? 0}
            className="w-20 rounded-md bg-white/10 px-2 py-1 text-center font-body text-[13px] tabular-nums text-white outline-none"
            placeholder={`${(splitEntry.episode_start ?? 0) + 1}`}
            autoFocus
          />
          <span className="font-body text-[11px] text-aura-muted">
            (Ep {(splitEntry.episode_start ?? 0) + 1}–{splitEntry.episode_end})
          </span>
          <button
            onClick={confirmSplit}
            className="rounded-lg bg-blue-500/20 px-3 py-1 font-body text-[12px] font-bold text-blue-400 transition-colors hover:bg-blue-500/30"
          >
            Split
          </button>
          <button
            onClick={cancelSplit}
            className="font-body text-[12px] text-aura-muted hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {hasGroups ? (
        /* Grouped layout with cover art headers */
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={`${group.parentSeries}-${group.startIndex}`} className="flex flex-col gap-2">
              {/* Group header — editable parent_series name */}
              <div className="flex items-center gap-4 rounded-lg border border-aura-border bg-aura-bg3/50 px-4 py-3">
                <div className="relative h-[48px] w-[34px] shrink-0 overflow-hidden rounded bg-aura-bg3">
                  {group.coverImageUrl ? (
                    <Image
                      src={group.coverImageUrl}
                      alt={group.parentSeries}
                      fill
                      className="object-cover"
                      sizes="34px"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-aura-muted/20 to-aura-bg3" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <input
                    type="text"
                    value={group.parentSeries === "Unknown" ? "" : group.parentSeries}
                    onChange={(e) => {
                      const newName = e.target.value || "Unknown";
                      setEntries((prev) =>
                        prev.map((entry) => {
                          const inGroup =
                            group.entries.some((ge) => ge.id === entry.id);
                          if (!inGroup) return entry;
                          return {
                            ...entry,
                            parent_series: newName,
                            _isModified: true,
                          };
                        }),
                      );
                    }}
                    placeholder="Series name..."
                    className="bg-transparent font-body text-[13px] font-bold text-white outline-none placeholder:text-aura-muted"
                  />
                  <p className="font-body text-[10px] text-aura-muted2">
                    {TYPE_LABELS[group.entries[0]?.entry_type ?? "episodes"] ?? "TV Series"} · {group.entries.length} {group.entries.length === 1 ? "entry" : "entries"}
                  </p>
                </div>
              </div>

              {/* Entries in this group — still part of flat reorder list */}
              <EditableEntryList
                entries={group.entries}
                onReorder={(reordered) => {
                  // Replace this group's entries in the flat list, keep others
                  setEntries((prev) => {
                    const next = [...prev];
                    next.splice(group.startIndex, group.entries.length, ...reordered);
                    return recalcPositions(next);
                  });
                }}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
                onSplit={handleSplitRequest}
                onInsertAt={(localIndex, data) => {
                  handleInsertAt(group.startIndex + localIndex, data);
                }}
                onInsertBlankAt={(localIndex) => {
                  handleInsertBlankAt(group.startIndex + localIndex);
                }}
              />
            </div>
          ))}

          {/* Add new group */}
          <button
            onClick={handleAddGroup}
            className="flex items-center gap-2 rounded-lg border border-dashed border-aura-border px-4 py-3 font-body text-[12px] text-aura-muted transition-colors hover:border-aura-orange/40 hover:text-aura-orange"
          >
            <Plus size={14} />
            Add series group
          </button>
        </div>
      ) : (
        /* Flat layout for single-group or unknown */
        <EditableEntryList
          entries={entries}
          onReorder={handleReorder}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onSplit={handleSplitRequest}
          onInsertAt={handleInsertAt}
          onInsertBlankAt={handleInsertBlankAt}
        />
      )}

      {showSubmitDialog && (
        <SubmitProposalDialog
          franchiseId={franchiseId}
          currentEntries={initialEntries}
          proposedEntries={entries}
          onClose={() => setShowSubmitDialog(false)}
          onSuccess={() => {
            setShowSubmitDialog(false);
            onSubmitSuccess();
          }}
        />
      )}
    </div>
  );
}

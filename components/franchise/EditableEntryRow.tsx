"use client";

import { GripVertical, X, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENTRY_TYPES, type EntryType } from "@/types/franchise";
import type { EditorEntry } from "@/types/proposal";

const ENTRY_TYPE_COLORS: Record<string, string> = {
  episodes: "border-entry-episodes/30",
  movie: "border-entry-movie/30",
  ova: "border-entry-ova/30",
  ona: "border-entry-ona/30",
  manga: "border-entry-manga/30",
  special: "border-entry-special/30",
};

interface EditableEntryRowProps {
  entry: EditorEntry;
  position: number;
  onUpdate: (id: string, partial: Partial<EditorEntry>) => void;
  onDelete: (id: string) => void;
  onSplit: (id: string) => void;
}

export default function EditableEntryRow({
  entry,
  position,
  onUpdate,
  onDelete,
  onSplit,
}: EditableEntryRowProps) {
  const canSplit =
    entry.entry_type === "episodes" &&
    entry.episode_start != null &&
    entry.episode_end != null &&
    entry.episode_end > entry.episode_start;

  const borderColor = ENTRY_TYPE_COLORS[entry.entry_type] ?? "border-aura-border";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-[#212121] p-3 transition-colors",
        borderColor,
        entry._isNew && "border-emerald-500/30 bg-emerald-500/5",
        entry._isModified && "border-amber-500/30 bg-amber-500/5",
      )}
    >
      {/* Drag handle */}
      <div className="shrink-0 cursor-grab text-aura-muted active:cursor-grabbing">
        <GripVertical size={16} />
      </div>

      {/* Position number */}
      <span className="w-6 shrink-0 text-center font-body text-xs tabular-nums text-aura-muted">
        {position}
      </span>

      {/* Title input */}
      <input
        type="text"
        value={entry.title}
        onChange={(e) =>
          onUpdate(entry.id, { title: e.target.value, _isModified: true })
        }
        onPointerDown={(e) => e.stopPropagation()}
        className="flex-1 bg-transparent font-body text-[13px] font-bold text-white outline-none placeholder:text-aura-muted"
        placeholder="Entry title"
      />

      {/* Type select */}
      <select
        value={entry.entry_type}
        onChange={(e) =>
          onUpdate(entry.id, {
            entry_type: e.target.value as EntryType,
            _isModified: true,
          })
        }
        onPointerDown={(e) => e.stopPropagation()}
        className="rounded-md bg-white/5 px-2 py-1 font-body text-[11px] text-aura-muted2 outline-none"
      >
        {ENTRY_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Episode range (only for episodes type) */}
      {entry.entry_type === "episodes" && (
        <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
          <input
            type="number"
            value={entry.episode_start ?? ""}
            onChange={(e) =>
              onUpdate(entry.id, {
                episode_start: e.target.value ? Number(e.target.value) : null,
                _isModified: true,
              })
            }
            className="w-14 rounded-md bg-white/5 px-2 py-1 text-center font-body text-[11px] tabular-nums text-white outline-none"
            placeholder="Start"
          />
          <span className="text-aura-muted">–</span>
          <input
            type="number"
            value={entry.episode_end ?? ""}
            onChange={(e) =>
              onUpdate(entry.id, {
                episode_end: e.target.value ? Number(e.target.value) : null,
                _isModified: true,
              })
            }
            className="w-14 rounded-md bg-white/5 px-2 py-1 text-center font-body text-[11px] tabular-nums text-white outline-none"
            placeholder="End"
          />
        </div>
      )}

      {/* Curator note input */}
      <input
        type="text"
        value={entry.curator_note ?? ""}
        onChange={(e) =>
          onUpdate(entry.id, {
            curator_note: e.target.value || null,
            _isModified: true,
          })
        }
        onPointerDown={(e) => e.stopPropagation()}
        className="w-[120px] shrink-0 bg-transparent font-body text-[11px] italic text-aura-muted2 outline-none placeholder:text-aura-muted/50"
        placeholder="Note..."
      />

      {/* Split button (episode blocks only) */}
      {canSplit && (
        <button
          onClick={() => onSplit(entry.id)}
          onPointerDown={(e) => e.stopPropagation()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
          title="Split episode block"
        >
          <Scissors size={14} />
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={() => onDelete(entry.id)}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-aura-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
        title="Remove entry"
      >
        <X size={14} />
      </button>
    </div>
  );
}

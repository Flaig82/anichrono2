"use client";

import { Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntryData } from "@/types/proposal";

/**
 * Border colors per entry type — matches EditableEntryRow exactly.
 */
const ENTRY_TYPE_BORDER: Record<string, string> = {
  episodes: "border-entry-episodes/30",
  movie: "border-entry-movie/30",
  ova: "border-entry-ova/30",
  ona: "border-entry-ona/30",
  manga: "border-entry-manga/30",
  special: "border-entry-special/30",
};

const ENTRY_TYPE_LABELS: Record<string, string> = {
  episodes: "Episodes",
  movie: "Movie",
  ova: "OVA",
  ona: "ONA",
  manga: "Manga",
  special: "Special",
};

function formatEpisodeInfo(entry: EntryData): string {
  if (entry.entry_type !== "episodes") {
    return ENTRY_TYPE_LABELS[entry.entry_type] ?? entry.entry_type;
  }
  if (entry.episode_start != null && entry.episode_end != null) {
    if (entry.episode_start === entry.episode_end) return `Ep ${entry.episode_start}`;
    return `Ep ${entry.episode_start}–${entry.episode_end}`;
  }
  return "Episodes";
}

interface RouteEntryRowProps {
  entry: EntryData;
  selected: boolean;
  position: number;
  onToggle: () => void;
  /** When true, shows drag handle (only in the reorder list, not the picker) */
  showDragHandle?: boolean;
}

/**
 * Entry row for the route creator — matches the visual style of
 * EditableEntryRow (same bg, border colors, grip handle, position badge)
 * but with a checkbox toggle instead of editing controls.
 */
export default function RouteEntryRow({
  entry,
  selected,
  position,
  onToggle,
  showDragHandle = false,
}: RouteEntryRowProps) {
  const borderColor = ENTRY_TYPE_BORDER[entry.entry_type] ?? "border-aura-border";
  const episodeInfo = formatEpisodeInfo(entry);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border p-3 transition-colors",
        selected
          ? `bg-[#212121] ${borderColor}`
          : "border-transparent bg-[#18181e] opacity-50 hover:opacity-80",
      )}
    >
      {/* Drag handle — only in the reorder section */}
      {showDragHandle && (
        <div className="shrink-0 cursor-grab text-aura-muted active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
      )}

      {/* Checkbox toggle */}
      <button
        onClick={onToggle}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
          selected
            ? "bg-aura-orange text-white"
            : "border border-aura-border bg-transparent hover:border-aura-muted2",
        )}
        aria-label={selected ? "Remove from route" : "Add to route"}
      >
        {selected && <Check size={14} strokeWidth={3} />}
      </button>

      {/* Position number */}
      <span className="w-6 shrink-0 text-center font-body text-xs tabular-nums text-aura-muted">
        {position}
      </span>

      {/* Title — read-only, matching EditableEntryRow's font style */}
      <span
        className={cn(
          "flex-1 font-body text-[13px] font-bold text-white",
          !selected && "text-aura-muted2",
        )}
      >
        {entry.title}
      </span>

      {/* Type label + episode info — right side, matching EditableEntryRow layout */}
      <span className="rounded-md bg-white/5 px-2 py-1 font-body text-[11px] text-aura-muted2">
        {entry.entry_type}
      </span>

      {entry.entry_type === "episodes" &&
        entry.episode_start != null &&
        entry.episode_end != null && (
          <span className="font-body text-[11px] tabular-nums text-aura-muted">
            {entry.episode_start}–{entry.episode_end}
          </span>
        )}

      {entry.entry_type !== "episodes" && (
        <span className="font-body text-[11px] text-aura-muted">
          {episodeInfo}
        </span>
      )}
    </div>
  );
}

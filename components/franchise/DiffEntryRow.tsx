"use client";

import { Plus, Minus, ArrowRight, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiffResult, DiffStatus } from "@/types/proposal";

const ENTRY_TYPE_COLORS: Record<string, string> = {
  episodes: "text-entry-episodes",
  movie: "text-entry-movie",
  ova: "text-entry-ova",
  ona: "text-entry-ona",
  manga: "text-entry-manga",
  special: "text-entry-special",
};

const STATUS_STYLES: Record<DiffStatus, { border: string; bg: string; icon: React.ReactNode; label: string }> = {
  added: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/5",
    icon: <Plus size={14} className="text-emerald-400" />,
    label: "Added",
  },
  removed: {
    border: "border-red-500/40",
    bg: "bg-red-500/5",
    icon: <Minus size={14} className="text-red-400" />,
    label: "Removed",
  },
  moved: {
    border: "border-blue-500/40",
    bg: "bg-blue-500/5",
    icon: <ArrowRight size={14} className="text-blue-400" />,
    label: "Moved",
  },
  changed: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/5",
    icon: <Pencil size={14} className="text-amber-400" />,
    label: "Changed",
  },
  unchanged: {
    border: "border-transparent",
    bg: "",
    icon: null,
    label: "",
  },
};

interface DiffEntryRowProps {
  diff: DiffResult;
}

export default function DiffEntryRow({ diff }: DiffEntryRowProps) {
  const { entry, status, previousPosition, changes } = diff;
  const style = STATUS_STYLES[status];
  const typeColor = ENTRY_TYPE_COLORS[entry.entry_type] ?? "text-aura-muted2";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-2",
        style.border,
        style.bg,
        status === "removed" && "opacity-60",
        status === "unchanged" && "opacity-40",
      )}
    >
      {/* Status icon */}
      <div className="flex w-5 shrink-0 items-center justify-center">
        {style.icon}
      </div>

      {/* Position */}
      <span className="w-6 shrink-0 text-center font-body text-xs tabular-nums text-aura-muted">
        {status === "removed" ? (
          <span className="line-through">{entry.position}</span>
        ) : (
          entry.position
        )}
      </span>

      {/* Title */}
      <span
        className={cn(
          "flex-1 font-body text-[13px] font-bold",
          status === "removed" ? "text-white/40 line-through" : "text-white",
        )}
      >
        {entry.title}
      </span>

      {/* Type badge */}
      <span className={cn("shrink-0 font-body text-[11px]", typeColor)}>
        {entry.entry_type}
      </span>

      {/* Change details */}
      {status === "moved" && previousPosition != null && (
        <span className="shrink-0 font-body text-[11px] text-blue-400">
          #{previousPosition} → #{entry.position}
        </span>
      )}
      {status === "changed" && changes && (
        <span className="shrink-0 font-body text-[11px] text-amber-400">
          {changes.join(", ")}
        </span>
      )}
    </div>
  );
}

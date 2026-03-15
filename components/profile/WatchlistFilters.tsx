"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WatchlistStatusFilter, WatchlistSort, WatchlistView } from "@/types/watchlist";

interface WatchlistFiltersProps {
  status: WatchlistStatusFilter;
  sort: WatchlistSort;
  view: WatchlistView;
  onStatusChange: (status: WatchlistStatusFilter) => void;
  onSortChange: (sort: WatchlistSort) => void;
  onViewChange: (view: WatchlistView) => void;
}

const STATUS_OPTIONS: { value: WatchlistStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "plan_to_watch", label: "Plan to Watch" },
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "dropped", label: "Dropped" },
];

const SORT_OPTIONS: { value: WatchlistSort; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "title", label: "Title" },
  { value: "progress", label: "Progress" },
];

export default function WatchlistFilters({
  status,
  sort,
  view,
  onStatusChange,
  onSortChange,
  onViewChange,
}: WatchlistFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Status tabs */}
      <div className="flex items-center gap-1.5">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onStatusChange(opt.value)}
            className={cn(
              "rounded-lg px-3 py-2 font-body text-[13px] font-bold tracking-[-0.13px] transition-colors",
              status === opt.value
                ? "bg-aura-orange text-white"
                : "bg-aura-bg3 text-aura-muted2 hover:text-white",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as WatchlistSort)}
          className="rounded-lg border border-aura-border2 bg-aura-bg3 px-3 py-2 font-mono text-[11px] text-white outline-none focus:border-aura-orange"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-aura-bg3 p-1">
          <button
            onClick={() => onViewChange("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "grid"
                ? "bg-aura-bg4 text-white"
                : "text-aura-muted hover:text-white",
            )}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => onViewChange("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "list"
                ? "bg-aura-bg4 text-white"
                : "text-aura-muted hover:text-white",
            )}
          >
            <List size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

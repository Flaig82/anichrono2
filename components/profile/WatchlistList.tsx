"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils";
import type { WatchlistItem, FranchiseWatchStatus } from "@/types/watchlist";

interface WatchlistListProps {
  items: WatchlistItem[];
  isLoading: boolean;
}

const STATUS_LABELS: Record<FranchiseWatchStatus, { label: string; color: string }> = {
  plan_to_watch: { label: "Plan to Watch", color: "text-gray-400" },
  watching: { label: "Watching", color: "text-blue-400" },
  completed: { label: "Completed", color: "text-green-400" },
  on_hold: { label: "On Hold", color: "text-amber-400" },
  dropped: { label: "Dropped", color: "text-red-400" },
};

export default function WatchlistList({ items, isLoading }: WatchlistListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-aura-bg3"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-aura-bg3 py-16">
        <span className="font-body text-[13px] text-aura-muted2">
          No franchises found
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="grid grid-cols-[1fr_100px_120px_100px] gap-3 px-4 py-2">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Title
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Status
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Progress
        </span>
        <span className="text-right font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Added
        </span>
      </div>

      {/* Rows */}
      {items.map((item) => {
        const franchise = item.franchise;
        if (!franchise) return null;
        const statusInfo = STATUS_LABELS[item.status];
        const progressPct = Math.round(item.progress * 100);

        return (
          <Link
            key={item.id}
            href={`/franchise/${franchise.slug}`}
            className="grid grid-cols-[1fr_100px_120px_100px] items-center gap-3 rounded-lg px-4 py-3 transition-colors hover:bg-aura-bg3"
          >
            {/* Title + cover + studio */}
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded bg-aura-bg4">
                {franchise.cover_image_url ? (
                  <Image
                    src={franchise.cover_image_url}
                    alt={franchise.title}
                    fill
                    className="object-cover"
                    sizes="28px"
                  />
                ) : null}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-body text-[13px] font-bold tracking-[-0.13px] text-white">
                  {franchise.title}
                </span>
                {franchise.studio && (
                  <span className="truncate font-mono text-[10px] text-aura-muted">
                    {franchise.studio}
                  </span>
                )}
              </div>
            </div>

            {/* Status */}
            <span className={cn("font-mono text-[11px] font-semibold", statusInfo.color)}>
              {statusInfo.label}
            </span>

            {/* Progress bar + fraction */}
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-aura-orange transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-aura-muted2">
                {item.entries_completed}/{item.entries_total}
              </span>
            </div>

            {/* Date added */}
            <span className="text-right font-mono text-[10px] text-aura-muted">
              {getRelativeTime(item.added_at)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

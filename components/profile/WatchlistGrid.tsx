"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { WatchlistItem, FranchiseWatchStatus } from "@/types/watchlist";

interface WatchlistGridProps {
  items: WatchlistItem[];
  isLoading: boolean;
}

const STATUS_BADGE: Record<FranchiseWatchStatus, { label: string; bg: string; text: string }> = {
  plan_to_watch: { label: "Plan to Watch", bg: "bg-gray-500/20", text: "text-gray-300" },
  watching: { label: "Watching", bg: "bg-blue-500/20", text: "text-blue-400" },
  completed: { label: "Completed", bg: "bg-green-500/20", text: "text-green-400" },
  on_hold: { label: "On Hold", bg: "bg-amber-500/20", text: "text-amber-400" },
  dropped: { label: "Dropped", bg: "bg-red-500/20", text: "text-red-400" },
};

export default function WatchlistGrid({ items, isLoading }: WatchlistGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] animate-pulse rounded-lg bg-aura-bg3"
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
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {items.map((item) => {
        const franchise = item.franchise;
        if (!franchise) return null;
        const badge = STATUS_BADGE[item.status];

        return (
          <Link
            key={item.id}
            href={`/franchise/${franchise.slug}`}
            className="group relative flex flex-col gap-2"
          >
            {/* Poster */}
            <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-aura-bg3">
              {franchise.cover_image_url ? (
                <Image
                  src={franchise.cover_image_url}
                  alt={franchise.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2">
                  <span className="text-center font-body text-[10px] leading-tight text-aura-muted2">
                    {franchise.title}
                  </span>
                </div>
              )}

              {/* Status badge */}
              <div className="absolute top-2 right-2">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[9px] font-semibold",
                    badge.bg,
                    badge.text,
                  )}
                >
                  {badge.label}
                </span>
              </div>

              {/* Progress bar at bottom of poster */}
              {item.entries_total > 0 && item.progress > 0 && (
                <div className="absolute right-0 bottom-0 left-0 h-1 bg-black/40">
                  <div
                    className="h-full bg-aura-orange transition-all"
                    style={{ width: `${Math.round(item.progress * 100)}%` }}
                  />
                </div>
              )}
            </div>

            {/* Title + progress */}
            <div className="flex flex-col gap-0.5">
              <span className="line-clamp-2 font-body text-[12px] font-bold leading-tight tracking-[-0.12px] text-white">
                {franchise.title}
              </span>
              {item.entries_total > 0 && (
                <span className="font-mono text-[10px] text-aura-muted2">
                  {item.entries_completed}/{item.entries_total} entries
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

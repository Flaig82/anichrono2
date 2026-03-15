"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";

interface WatchlistPreviewProps {
  handle: string;
  isOwnProfile: boolean;
  isWatchlistPublic: boolean;
}

export default function WatchlistPreview({
  handle,
  isOwnProfile,
  isWatchlistPublic,
}: WatchlistPreviewProps) {
  const canView = isWatchlistPublic || isOwnProfile;
  const { items, isLoading, total } = useWatchlist(
    canView ? handle : null,
    "all",
    "recent",
    1,
  );

  // Slice to 6 items for preview
  const previewItems = items.slice(0, 6);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Watchlist
        </span>
        {canView && total > 0 && (
          <Link
            href={`/u/${handle}/watchlist`}
            className="font-mono text-[10px] font-semibold tracking-[0.1em] text-aura-orange transition-colors hover:text-aura-orange-hover"
          >
            View all ({total})
          </Link>
        )}
      </div>

      {!canView ? (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-aura-bg3 px-6 py-10">
          <Lock size={14} className="text-aura-muted" />
          <span className="font-body text-[13px] text-aura-muted2">
            This user&apos;s watchlist is private
          </span>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] animate-pulse rounded-lg bg-aura-bg3"
            />
          ))}
        </div>
      ) : previewItems.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg bg-aura-bg3 px-6 py-10">
          <span className="font-body text-[13px] text-aura-muted2">
            No franchises yet
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {previewItems.map((item) => {
            const franchise = item.franchise;
            if (!franchise) return null;
            return (
              <Link
                key={item.id}
                href={`/franchise/${franchise.slug}`}
                className="group relative aspect-[2/3] overflow-hidden rounded-lg bg-aura-bg3"
                title={franchise.title}
              >
                {franchise.cover_image_url ? (
                  <Image
                    src={franchise.cover_image_url}
                    alt={franchise.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, 16vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-1">
                    <span className="text-center font-body text-[9px] leading-tight text-aura-muted2">
                      {franchise.title}
                    </span>
                  </div>
                )}

                {/* Progress bar overlay at bottom */}
                {item.entries_total > 0 && item.progress > 0 && (
                  <div className="absolute right-0 bottom-0 left-0 h-1 bg-black/40">
                    <div
                      className="h-full bg-aura-orange"
                      style={{ width: `${Math.round(item.progress * 100)}%` }}
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

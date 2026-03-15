"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, BookmarkCheck, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useFranchiseWatchlist } from "@/hooks/use-franchise-watchlist";
import type { FranchiseWatchStatus } from "@/types/watchlist";

interface FranchiseHeroProps {
  franchiseId: string;
  title: string;
  description: string | null;
  bannerImageUrl: string | null;
  genres: string[];
}

const STATUS_CONFIG: Record<FranchiseWatchStatus, { label: string; color: string }> = {
  plan_to_watch: { label: "Plan to Watch", color: "bg-gray-500" },
  watching: { label: "Watching", color: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-green-500" },
  on_hold: { label: "On Hold", color: "bg-amber-500" },
  dropped: { label: "Dropped", color: "bg-red-500" },
};

const STATUS_OPTIONS: FranchiseWatchStatus[] = [
  "plan_to_watch",
  "watching",
  "on_hold",
  "dropped",
];

export default function FranchiseHero({
  franchiseId,
  title,
  description,
  bannerImageUrl,
  genres,
}: FranchiseHeroProps) {
  const primaryGenre = genres[0] ?? "Anime";
  const { user } = useAuth();
  const { status, addToWatchlist, updateStatus, removeFromWatchlist } =
    useFranchiseWatchlist(franchiseId);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [dropdownOpen]);

  const isOnWatchlist = status !== null;
  const currentConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <div className="relative">
      {/* Banner image */}
      <div className="relative h-[200px] w-full md:h-[260px] lg:h-[320px]">
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {bannerImageUrl ? (
            <Image
              src={bannerImageUrl}
              alt={title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-aura-bg3 to-aura-bg" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-4 md:p-8 lg:p-16">
          <div className="flex max-w-full flex-col gap-3 md:gap-4 lg:max-w-[768px]">
            {/* Breadcrumb */}
            <nav className="hidden items-center gap-1.5 font-brand text-[14px] font-bold sm:flex">
              <Link
                href="/discover"
                className="text-white/[0.48] transition-colors hover:text-white/70"
              >
                DISCOVER
              </Link>
              <ChevronRight size={14} className="text-white/[0.48]" />
              <Link
                href={`/discover?genre=${encodeURIComponent(primaryGenre)}`}
                className="text-white/[0.48] transition-colors hover:text-white/70"
              >
                {primaryGenre.toUpperCase()}
              </Link>
              <ChevronRight size={14} className="text-white/[0.48]" />
              <span className="text-white">{title.toUpperCase()}</span>
            </nav>

            {/* Title */}
            <h1 className="font-body text-[22px] font-bold leading-tight tracking-[-0.44px] text-white md:text-[28px] md:tracking-[-0.56px] lg:text-[36px] lg:tracking-[-0.72px]">
              {title}
            </h1>

            {/* Description (subtitle) */}
            {description && (
              <p className="line-clamp-2 font-body text-[14px] leading-relaxed text-white/70">
                {description}
              </p>
            )}

            {/* Watchlist CTA */}
            {user && (
              <div className="relative mt-1" ref={dropdownRef}>
                {!isOnWatchlist ? (
                  <button
                    onClick={() => addToWatchlist("plan_to_watch")}
                    className="flex items-center gap-2 rounded-full bg-aura-orange px-6 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white transition-colors hover:bg-aura-orange-hover"
                  >
                    <Bookmark size={16} />
                    Add to Watchlist
                  </button>
                ) : (
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 font-body text-[14px] font-bold tracking-[-0.28px] text-white backdrop-blur-sm transition-colors hover:bg-white/15"
                  >
                    <BookmarkCheck size={16} className="text-aura-orange" />
                    {currentConfig?.label}
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform",
                        dropdownOpen && "rotate-180",
                      )}
                    />
                  </button>
                )}

                {/* Status dropdown */}
                {dropdownOpen && isOnWatchlist && (
                  <div className="absolute top-full left-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-aura-border bg-aura-bg2 shadow-xl">
                    {STATUS_OPTIONS.map((opt) => {
                      const config = STATUS_CONFIG[opt];
                      const isActive = status === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            updateStatus(opt);
                            setDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-aura-bg4",
                            isActive && "bg-aura-bg3",
                          )}
                        >
                          <div className={cn("h-2 w-2 shrink-0 rounded-full", config.color)} />
                          <span className="font-body text-[13px] font-semibold text-white">
                            {config.label}
                          </span>
                        </button>
                      );
                    })}

                    <div className="border-t border-aura-border" />
                    <button
                      onClick={() => {
                        removeFromWatchlist();
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-red-500/10"
                    >
                      <Trash2 size={12} className="shrink-0 text-red-400" />
                      <span className="font-body text-[13px] font-semibold text-red-400">
                        Remove from Watchlist
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

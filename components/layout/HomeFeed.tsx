"use client";

import Image from "next/image";
import {
  Bookmark,
  Heart,
  Eye,
  ListPlus,
  Star,
  CheckCircle2,
  FilePlus2,
  GitPullRequestArrow,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";

/* ── Rapid user activity (top section) ── */

interface LiveItem {
  user: string;
  avatar: string;
  action: string;
  title: string;
  timestamp: string;
}

const liveItems: LiveItem[] = [
  {
    user: "Pyrat",
    avatar: "/images/avatar-1.svg",
    action: "completed",
    title: "One Piece — Egghead Arc",
    timestamp: "2m ago",
  },
  {
    user: "ArcaneWatcher",
    avatar: "/images/avatar-2.svg",
    action: "added to watchlist",
    title: "Solo Leveling Season 2",
    timestamp: "5m ago",
  },
  {
    user: "GhostInTheShell",
    avatar: "/images/avatar-3.svg",
    action: "rated 9.2",
    title: "Dandadan",
    timestamp: "8m ago",
  },
  {
    user: "NeonSamurai",
    avatar: "/images/avatar-4.svg",
    action: "started watching",
    title: "Blue Lock Season 2",
    timestamp: "12m ago",
  },
  {
    user: "MidnightCrow",
    avatar: "/images/avatar-1.svg",
    action: "completed",
    title: "Vinland Saga Season 2",
    timestamp: "15m ago",
  },
  {
    user: "Spectra",
    avatar: "/images/avatar-3.svg",
    action: "dropped",
    title: "Fairy Tail: 100 Years Quest",
    timestamp: "22m ago",
  },
];

const actionIcons: Record<string, typeof Eye> = {
  completed: CheckCircle2,
  "added to watchlist": ListPlus,
  "started watching": Eye,
  dropped: RefreshCw,
};

function getActionIcon(action: string) {
  if (action.startsWith("rated")) return Star;
  return actionIcons[action] ?? Eye;
}

/* ── Slower content updates (bottom section) ── */

interface UpdateItem {
  type: "chronicle" | "order" | "addition";
  title: string;
  description: string;
  poster?: string;
  liked?: boolean;
  timestamp: string;
}

const updateItems: UpdateItem[] = [
  {
    type: "chronicle",
    title: "Newcomer Route — Naruto",
    description: "New chronicle created by ArcaneWatcher",
    poster: "/images/poster-1.svg",
    liked: false,
    timestamp: "1h ago",
  },
  {
    type: "order",
    title: "Jujutsu Kaisen",
    description: "Movie insertion approved at position 14",
    liked: false,
    timestamp: "2h ago",
  },
  {
    type: "addition",
    title: "Sakamoto Days",
    description: "Added to franchise database",
    poster: "/images/poster-5.svg",
    liked: true,
    timestamp: "3h ago",
  },
  {
    type: "order",
    title: "One Piece",
    description: "Episode block split — Film Red inserted at ep 1085",
    liked: false,
    timestamp: "5h ago",
  },
  {
    type: "chronicle",
    title: "Manga Reader Route — Bleach",
    description: "Chronicle promoted to canon status",
    poster: "/images/poster-2.svg",
    liked: true,
    timestamp: "6h ago",
  },
  {
    type: "addition",
    title: "Solo Leveling: Ragnarok",
    description: "Season 3 announced — prediction window open",
    liked: false,
    timestamp: "8h ago",
  },
  {
    type: "order",
    title: "Demon Slayer",
    description: "Infinity Castle arc added to master order",
    poster: "/images/poster-3.svg",
    liked: true,
    timestamp: "12h ago",
  },
  {
    type: "chronicle",
    title: "Completionist Route — Monogatari",
    description: "Updated with Off Season entries",
    liked: false,
    timestamp: "1d ago",
  },
];

const updateTypeIcons = {
  chronicle: FilePlus2,
  order: GitPullRequestArrow,
  addition: Plus,
} as const;

/* ── Shared ── */

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-10"
      style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
    />
  );
}

/* ── Update card (bottom feed) ── */

function UpdateCard({ item }: { item: UpdateItem }) {
  const { containerRef, canvasRef } = useDitherHover();

  const Icon = updateTypeIcons[item.type];

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-lg p-5"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-lg"
      />
      <PatternOverlay />
      {/* Content row */}
      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div className="shrink-0 pt-0.5">
          <Icon size={16} className="text-aura-muted2" />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="font-body text-[14px] font-bold tracking-[-0.28px] text-white">
            {item.title}
          </p>
          <p className="mt-1 font-body text-[12px] tracking-[-0.12px] text-white">
            {item.description}
          </p>
        </div>

        {/* Poster thumbnail */}
        {item.poster && (
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
            <Image src={item.poster} alt="" fill className="object-cover" />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Footer */}
      <div className="flex items-center gap-2.5">
        <span className="flex-1 font-body text-[12px] tracking-[-0.12px] text-white/50">
          {item.timestamp}
        </span>

        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-aura-bg3/50 transition-colors hover:bg-aura-bg3">
          <Bookmark size={12} className="text-white/50" />
        </button>

        {item.liked ? (
          <button
            className="flex h-6 w-6 items-center justify-center rounded-full border-b border-aura-orange-hover bg-aura-orange transition-colors"
            style={{ boxShadow: "0px 4px 14px rgba(255, 131, 74, 0.48)" }}
          >
            <Heart size={12} className="text-white" />
          </button>
        ) : (
          <button className="flex h-6 w-6 items-center justify-center rounded-full bg-aura-bg3/50 transition-colors hover:bg-aura-bg3">
            <Heart size={12} className="text-white/50" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main export ── */

export default function HomeFeed() {
  return (
    <>
      {/* ── Live Activity (rapid) ── */}
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-lg bg-aura-bg3 p-6">
        <PatternOverlay />
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-aura-orange-hover" />
          <span className="font-brand text-[14px] font-bold tracking-[-0.7px] text-aura-orange-hover">
            Live
          </span>
        </div>

        {/* Activity stream */}
        {liveItems.map((item, i) => {
          const Icon = getActionIcon(item.action);
          return (
            <div key={i}>
              <div className="flex items-start gap-3.5">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                  <Image src={item.avatar} alt="" fill className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <p className="font-body text-[13px] font-bold tracking-[-0.26px] text-white">
                      {item.user}
                    </p>
                    <Icon size={12} className="shrink-0 text-aura-muted" />
                    <span className="truncate font-body text-[12px] tracking-[-0.12px] text-aura-muted2">
                      {item.action}
                    </span>
                  </div>
                  <p className="font-body text-[13px] tracking-[-0.26px] text-white/80">
                    {item.title}
                  </p>
                </div>
                <span className="shrink-0 pt-0.5 font-mono text-[10px] text-aura-muted">
                  {item.timestamp}
                </span>
              </div>
              {i < liveItems.length - 1 && (
                <div className="mt-6 h-px bg-white/[0.06]" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Updates (slower content feed) ── */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="relative overflow-hidden rounded-lg px-5 pb-2 pt-5">
          <PatternOverlay />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Updates
          </span>
        </div>

        {updateItems.map((item, i) => (
          <UpdateCard key={i} item={item} />
        ))}
      </div>
    </>
  );
}

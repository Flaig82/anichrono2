"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp,
  GitPullRequestArrow,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useDitherHover } from "@/hooks/use-dither-hover";
import { useLiveActivity, useContentUpdates } from "@/hooks/use-activity-feed";
import { getRelativeTime } from "@/lib/utils";
import AuthModal from "@/components/shared/AuthModal";
import type { LiveActivityItem, ContentUpdateItem } from "@/types/activity";

/* ── Like helper ── */

async function toggleLike(
  id: string,
  itemType: "activity" | "proposal" | "franchise",
  currentlyLiked: boolean,
): Promise<{ liked: boolean; likeCount: number } | null> {
  try {
    const res = currentlyLiked
      ? await fetch(`/api/activity/${id}/like?item_type=${itemType}`, { method: "DELETE" })
      : await fetch(`/api/activity/${id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_type: itemType }),
        });

    if (res.status === 401) return null; // signal auth needed
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Too many requests. Slow down.");
      return { liked: currentlyLiked, likeCount: -1 };
    }
    if (!res.ok) return { liked: currentlyLiked, likeCount: -1 }; // keep current state
    return res.json();
  } catch {
    return { liked: currentlyLiked, likeCount: -1 };
  }
}

/* ── Action display mapping ── */

const ACTION_LABELS: Record<string, string> = {
  complete_entry: "watched",
  start_watching: "started watching",
  review: "reviewed",
  rate: "rated",
  drop: "dropped",
  add_to_watchlist: "added to watchlist",
  anilist_import: "imported from AniList",
  add_to_watchlist__plan_to_watch: "plans to watch",
  add_to_watchlist__watching: "is watching",
  add_to_watchlist__on_hold: "put on hold",
  add_to_watchlist__dropped: "dropped",
};

function getActionLabel(item: LiveActivityItem): string {
  if (item.type === "rate" && item.metadata?.score) {
    return `rated ${item.metadata.score}`;
  }
  if (item.type === "add_to_watchlist" && item.metadata?.status) {
    const key = `add_to_watchlist__${item.metadata.status}`;
    if (ACTION_LABELS[key]) return ACTION_LABELS[key];
  }
  return ACTION_LABELS[item.type] ?? item.type;
}

/* ── Shared ── */

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-10"
      style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
    />
  );
}

function AvatarFallback({ name }: { name: string | null }) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-aura-bg4 font-body text-[13px] font-bold text-aura-muted2">
      {initial}
    </div>
  );
}

/* ── Like button ── */

function LikeButton({
  liked,
  count,
  onClick,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 transition-colors"
      type="button"
    >
      {count > 0 && (
        <span className={`font-mono text-[11px] ${liked ? "text-aura-orange" : "text-aura-muted2"}`}>
          {count}
        </span>
      )}
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
          liked
            ? "bg-[#eb6325] shadow-[0_4px_14px_rgba(255,131,74,0.48)]"
            : "bg-white/[0.08] hover:bg-white/[0.14]"
        }`}
      >
        <ThumbsUp size={12} className={liked ? "text-white" : "text-aura-muted2"} />
      </div>
    </button>
  );
}

/* ── Skeleton loader ── */

function LiveSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-start gap-6 animate-pulse">
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.06]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3.5 w-28 rounded bg-white/[0.06]" />
              <div className="h-3 w-44 rounded bg-white/[0.06]" />
            </div>
          </div>
          {i < 3 && <div className="mt-4 h-px bg-white/[0.06]" />}
        </div>
      ))}
    </>
  );
}

function UpdatesSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="relative flex flex-col gap-3.5 overflow-hidden rounded-lg p-5 animate-pulse">
          <PatternOverlay />
          <div className="flex items-start gap-3.5">
            <div className="h-4 w-4 shrink-0 rounded bg-white/[0.06]" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="h-3 w-32 rounded bg-white/[0.06]" />
              <div className="h-3 w-48 rounded bg-white/[0.06]" />
            </div>
          </div>
          <div className="h-px bg-white/[0.06]" />
          <div className="h-3 w-16 rounded bg-white/[0.06]" />
        </div>
      ))}
    </>
  );
}

/* ── Update card (bottom feed) ── */

function UpdateCard({
  item,
  onLike,
}: {
  item: ContentUpdateItem;
  onLike: (id: string, kind: ContentUpdateItem["kind"]) => void;
}) {
  const { containerRef, canvasRef } = useDitherHover();

  const Icon = item.kind === "proposal_applied" ? GitPullRequestArrow : Plus;

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
            <Image src={item.poster} alt="" fill className="object-cover" quality={60} sizes="48px" />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Footer */}
      <div className="flex items-center gap-2.5">
        <span className="flex-1 font-body text-[12px] tracking-[-0.12px] text-white/50">
          {getRelativeTime(item.created_at)}
        </span>

        <LikeButton
          liked={item.user_liked}
          count={item.like_count}
          onClick={() => onLike(item.id, item.kind)}
        />
      </div>
    </div>
  );
}

/* ── Main export ── */

const itemVariants = {
  initial: { opacity: 0, y: -12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

export default function HomeFeed() {
  const { data: liveItems, isLoading: liveLoading, mutate: mutateLive } = useLiveActivity();
  const { data: updateItems, isLoading: updatesLoading, mutate: mutateUpdates } = useContentUpdates();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Track IDs we've already rendered so we only animate truly new items
  const seenIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (liveItems && liveItems.length > 0) {
      if (isInitialLoad.current) {
        // On first load, mark all as seen (no animation)
        liveItems.forEach((item) => seenIdsRef.current.add(item.id));
        isInitialLoad.current = false;
      } else {
        // On subsequent polls, new IDs will animate, then get marked seen
        const timer = setTimeout(() => {
          liveItems.forEach((item) => seenIdsRef.current.add(item.id));
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [liveItems]);

  const handleLiveLike = useCallback(
    async (id: string) => {
      if (!liveItems) return;
      const item = liveItems.find((i) => i.id === id);
      if (!item) return;

      // Optimistic update
      const optimistic = liveItems.map((i) =>
        i.id === id
          ? {
              ...i,
              user_liked: !i.user_liked,
              like_count: i.user_liked ? i.like_count - 1 : i.like_count + 1,
            }
          : i,
      );
      mutateLive(optimistic, false);

      const result = await toggleLike(id, "activity", item.user_liked);
      if (result === null) {
        // Auth required — revert and show modal
        mutateLive(liveItems, false);
        setShowAuthModal(true);
        return;
      }
      if (result.likeCount === -1) {
        // Error or rate limit — revert to pre-click state
        mutateLive(liveItems, false);
        return;
      }
      // Success — keep optimistic state, no revalidation needed
    },
    [liveItems, mutateLive],
  );

  const handleUpdateLike = useCallback(
    async (id: string, kind: ContentUpdateItem["kind"]) => {
      if (!updateItems) return;
      const item = updateItems.find((i) => i.id === id);
      if (!item) return;

      const itemType = kind === "proposal_applied" ? "proposal" : "franchise";

      // Optimistic update
      const optimistic = updateItems.map((i) =>
        i.id === id
          ? {
              ...i,
              user_liked: !i.user_liked,
              like_count: i.user_liked ? i.like_count - 1 : i.like_count + 1,
            }
          : i,
      );
      mutateUpdates(optimistic, false);

      const result = await toggleLike(id, itemType, item.user_liked);
      if (result === null) {
        mutateUpdates(updateItems, false);
        setShowAuthModal(true);
        return;
      }
      if (result.likeCount === -1) {
        // Error or rate limit — revert to pre-click state
        mutateUpdates(updateItems, false);
        return;
      }
      // Success — keep optimistic state, no revalidation needed
    },
    [updateItems, mutateUpdates],
  );

  return (
    <>
      {/* ── The Feed ── */}
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-lg bg-aura-bg3 p-6">
        <PatternOverlay />
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-aura-orange-hover" />
          <span className="font-brand text-[14px] font-bold tracking-[-0.7px] text-aura-orange-hover">
            The Feed
          </span>
        </div>

        {/* Intro headline */}
        <div className="flex items-center justify-center py-6">
          <p className="w-[252px] font-body text-2xl font-bold tracking-[-0.48px] text-white">
            See what the community is watching right now.
          </p>
        </div>

        {/* Activity stream — scrollable */}
        <div className="max-h-[480px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <div className="flex flex-col gap-4">
            {liveLoading ? (
              <LiveSkeleton />
            ) : !liveItems || liveItems.length === 0 ? (
              <p className="py-4 text-center font-body text-[12px] text-aura-muted">
                No recent activity
              </p>
            ) : (
              <AnimatePresence initial={false}>
                {liveItems.map((item, i) => {
                  const userName = item.user?.display_name ?? "Anonymous";
                  const profileSlug = item.user?.handle ?? item.user_id;
                  const franchiseTitle = item.franchise?.title;
                  const entryTitle = item.entry?.title;
                  const displayTitle = franchiseTitle && entryTitle
                    ? `${franchiseTitle} — ${entryTitle}`
                    : entryTitle ?? franchiseTitle ?? "Unknown";
                  const isNew = !seenIdsRef.current.has(item.id);
                  return (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      initial={isNew ? "initial" : false}
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <div className="flex items-start gap-6">
                        <Link href={`/u/${profileSlug}`} className="shrink-0">
                          {item.user?.avatar_url ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-full">
                              <Image src={item.user.avatar_url} alt="" fill className="object-cover" />
                            </div>
                          ) : (
                            <AvatarFallback name={userName} />
                          )}
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <p className="font-body text-[14px] font-bold tracking-[-0.28px] text-white">
                            <Link
                              href={`/u/${profileSlug}`}
                              className="hover:text-aura-orange transition-colors"
                            >
                              {userName}
                            </Link>{" "}
                            <span className="font-normal text-aura-muted2">{getActionLabel(item)}</span>
                          </p>
                          <p className="font-body text-[12px] tracking-[-0.12px] text-white/80">
                            {displayTitle}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <LikeButton
                            liked={item.user_liked}
                            count={item.like_count}
                            onClick={() => handleLiveLike(item.id)}
                          />
                        </div>
                      </div>
                      {i < liveItems.length - 1 && (
                        <div className="mt-4 h-px bg-white/[0.06]" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ── Updates (slower content feed) ── */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="relative overflow-hidden rounded-lg px-5 pb-2 pt-5">
          <PatternOverlay />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Updates
          </span>
        </div>

        {updatesLoading ? (
          <UpdatesSkeleton />
        ) : !updateItems || updateItems.length === 0 ? (
          <div className="relative overflow-hidden rounded-lg p-5">
            <PatternOverlay />
            <p className="text-center font-body text-[12px] text-aura-muted">
              No recent updates
            </p>
          </div>
        ) : (
          updateItems.map((item) => (
            <UpdateCard key={item.id} item={item} onLike={handleUpdateLike} />
          ))
        )}
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}

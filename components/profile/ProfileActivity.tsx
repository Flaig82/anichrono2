"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getRelativeTime } from "@/lib/utils";
import { toggleLike } from "@/lib/toggle-like";
import LikeButton from "@/components/shared/LikeButton";
import AuthModal from "@/components/shared/AuthModal";
import type { PublicProfile } from "@/types/user";
import type { ActivityItem } from "@/hooks/use-public-profile";

const ACTION_LABELS: Record<string, string> = {
  complete_entry: "completed",
  start_watching: "started watching",
  watch_episode: "watched",
  review: "reviewed",
  rate: "rated",
  drop: "dropped",
  new_discussion: "started a discussion on",
  discussion_reply: "replied in a discussion on",
};

interface ProfileActivityProps {
  profile: PublicProfile;
  activity: ActivityItem[];
}

export default function ProfileActivity({
  profile,
  activity,
}: ProfileActivityProps) {
  const [items, setItems] = useState<ActivityItem[]>(activity);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync local state when prop changes (e.g. SWR revalidation)
  useEffect(() => {
    setItems(activity);
  }, [activity]);

  const handleLike = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;

      // Optimistic update
      const optimistic = items.map((i) =>
        i.id === id
          ? {
              ...i,
              user_liked: !i.user_liked,
              like_count: i.user_liked ? i.like_count - 1 : i.like_count + 1,
            }
          : i,
      );
      setItems(optimistic);

      const result = await toggleLike(id, "activity", item.user_liked);
      if (result === null) {
        setItems(items);
        setShowAuthModal(true);
        return;
      }
      if (result.likeCount === -1) {
        setItems(items);
        return;
      }
      const confirmed = items.map((i) =>
        i.id === id
          ? { ...i, user_liked: result.liked, like_count: result.likeCount }
          : i,
      );
      setItems(confirmed);
    },
    [items],
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          Recent Activity
        </span>
        <p className="py-6 text-center font-body text-[13px] text-aura-muted2">
          No recent activity
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
        Recent Activity
      </span>

      <div className="flex flex-col gap-4 rounded-lg bg-aura-bg3 p-5">
        {items.map((item, i) => {
          const actionLabel = ACTION_LABELS[item.type] ?? item.type;
          const franchiseTitle = item.franchise?.title;
          const entryTitle = item.entry?.title;
          const displayTitle =
            franchiseTitle && entryTitle
              ? `${franchiseTitle} — ${entryTitle}`
              : entryTitle ?? franchiseTitle ?? "Unknown";

          return (
            <div key={item.id}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-aura-bg4">
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-body text-[10px] font-bold text-white">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="font-body text-[13px] tracking-[-0.13px] text-white">
                    <span className="font-bold">{profile.display_name}</span>{" "}
                    <span className="text-aura-muted2">{actionLabel}</span>
                  </p>
                  {item.franchise?.slug ? (
                    <Link
                      href={`/franchise/${item.franchise.slug}`}
                      className="font-body text-[12px] tracking-[-0.12px] text-white/80 hover:text-white transition-colors"
                    >
                      {displayTitle}
                    </Link>
                  ) : (
                    <p className="font-body text-[12px] tracking-[-0.12px] text-white/80">
                      {displayTitle}
                    </p>
                  )}
                  <span className="font-mono text-[10px] text-aura-muted">
                    {getRelativeTime(item.created_at)}
                  </span>
                </div>

                <div className="shrink-0">
                  <LikeButton
                    liked={item.user_liked}
                    count={item.like_count}
                    onClick={() => handleLike(item.id)}
                  />
                </div>
              </div>
              {i < items.length - 1 && (
                <div className="mt-4 h-px bg-white/[0.06]" />
              )}
            </div>
          );
        })}
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

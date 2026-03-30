"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, ThumbsUp, Trophy, Star, MessageSquare, Check } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import {
  useNotifications,
  useUnreadCount,
  markNotificationsRead,
  type NotificationItem,
} from "@/hooks/use-notifications";

const TYPE_ICONS: Record<string, typeof ThumbsUp> = {
  like: ThumbsUp,
  quest_complete: Trophy,
  era_promotion: Star,
  discussion_reply: MessageSquare,
};

const TYPE_COLORS: Record<string, string> = {
  like: "text-aura-orange",
  quest_complete: "text-aura-veteran",
  era_promotion: "text-aura-sensei",
  discussion_reply: "text-aura-scholar",
};

function NotificationRow({ item }: { item: NotificationItem }) {
  const Icon = TYPE_ICONS[item.type] ?? Bell;
  const color = TYPE_COLORS[item.type] ?? "text-aura-muted2";

  let message = item.message;
  if (item.type === "like" && item.grouped_count && item.grouped_count > 1) {
    const actorName = item.actor?.display_name ?? "Someone";
    const others = item.grouped_count - 1;
    message = `${actorName} and ${others} other${others > 1 ? "s" : ""} liked your activity`;
  }

  const linkHref =
    item.type === "discussion_reply" && item.entity_id
      ? `/discussion/${item.entity_id}`
      : item.actor?.handle
        ? `/u/${item.actor.handle}`
        : undefined;

  const content = (
    <div
      className={`flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.04] ${
        !item.read ? "bg-white/[0.02]" : ""
      }`}
    >
      {/* Icon or avatar */}
      {item.actor?.avatar_url ? (
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
          <Image
            src={item.actor.avatar_url}
            alt=""
            fill
            className="object-cover"
            sizes="32px"
          />
        </div>
      ) : (
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ${color}`}>
          <Icon size={14} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="font-body text-[12px] leading-relaxed text-white/90">
          {message}
        </p>
        <span className="font-mono text-[10px] text-aura-muted">
          {getRelativeTime(item.created_at)}
        </span>
      </div>

      {!item.read && (
        <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-aura-orange" />
      )}
    </div>
  );

  if (linkHref) {
    return <Link href={linkHref}>{content}</Link>;
  }
  return content;
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { unreadCount, mutateCount } = useUnreadCount(true);
  const { notifications, isLoading, mutate } = useNotifications(open);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleMarkAllRead() {
    await markNotificationsRead();
    mutateCount({ count: 0 }, false);
    mutate();
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative text-aura-muted transition-colors hover:text-white"
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-aura-orange px-1 font-mono text-[9px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-aura-border bg-aura-bg2 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-aura-border px-4 py-3">
            <span className="font-body text-[13px] font-bold text-white">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 font-mono text-[10px] text-aura-muted2 transition-colors hover:text-white"
              >
                <Check size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {isLoading ? (
              <div className="flex flex-col gap-1 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-start gap-3 rounded-lg px-3 py-2.5"
                  >
                    <div className="h-8 w-8 shrink-0 rounded-full bg-white/[0.06]" />
                    <div className="flex flex-1 flex-col gap-1.5">
                      <div className="h-3 w-full rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-16 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10">
                <Bell size={20} className="text-aura-muted" />
                <p className="font-body text-[12px] text-aura-muted">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-2">
                {notifications.map((n) => (
                  <NotificationRow key={n.id} item={n} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

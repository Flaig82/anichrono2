"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Pin } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import type { DiscussionItem } from "@/hooks/use-discussions";

interface DiscussionCardProps {
  discussion: DiscussionItem;
  onClick: () => void;
}

export default function DiscussionCard({
  discussion,
  onClick,
}: DiscussionCardProps) {
  const authorSlug = discussion.author?.handle ?? discussion.author_id;

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-3 rounded-lg bg-aura-bg3 p-5 text-left transition-colors hover:bg-aura-bg4"
    >
      {/* Title row */}
      <div className="flex items-start gap-3">
        {discussion.is_pinned && (
          <Pin size={14} className="mt-0.5 shrink-0 text-aura-orange" />
        )}
        <h3 className="min-w-0 flex-1 font-body text-[14px] font-bold tracking-[-0.28px] text-white">
          {discussion.title}
        </h3>
      </div>

      {/* Body preview */}
      <p className="font-body text-[12px] leading-relaxed tracking-[-0.12px] text-white/60">
        {discussion.body.length > 120
          ? `${discussion.body.slice(0, 120)}...`
          : discussion.body}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-3">
        {/* Author */}
        <Link
          href={`/u/${authorSlug}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          {discussion.author?.avatar_url ? (
            <div className="relative h-5 w-5 overflow-hidden rounded-full">
              <Image
                src={discussion.author.avatar_url}
                alt=""
                fill
                className="object-cover"
                sizes="20px"
              />
            </div>
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-aura-bg4 font-body text-[8px] font-bold text-aura-muted2">
              {(discussion.author?.display_name ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-body text-[11px] text-white/50">
            {discussion.author?.display_name ?? "Unknown"}
          </span>
        </Link>

        <span className="font-mono text-[10px] text-aura-muted">
          {getRelativeTime(discussion.created_at)}
        </span>

        <div className="ml-auto flex items-center gap-1.5 text-aura-muted">
          <MessageSquare size={12} />
          <span className="font-mono text-[11px]">
            {discussion.reply_count}
          </span>
        </div>
      </div>
    </button>
  );
}

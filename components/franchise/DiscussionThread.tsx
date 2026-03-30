"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import { toggleLike } from "@/lib/toggle-like";
import LikeButton from "@/components/shared/LikeButton";
import AuthModal from "@/components/shared/AuthModal";
import DiscussionReplyForm from "./DiscussionReplyForm";
import { useDiscussionThread } from "@/hooks/use-discussions";
import { useAuth } from "@/hooks/use-auth";

interface DiscussionThreadProps {
  discussionId: string;
  onBack: () => void;
}

export default function DiscussionThread({
  discussionId,
  onBack,
}: DiscussionThreadProps) {
  const { user } = useAuth();
  const { discussion, replies, isLoading, mutate } =
    useDiscussionThread(discussionId);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleReplyLike = useCallback(
    async (replyId: string) => {
      const reply = replies.find((r) => r.id === replyId);
      if (!reply) return;

      // Optimistic update
      const optimistic = replies.map((r) =>
        r.id === replyId
          ? {
              ...r,
              user_liked: !r.user_liked,
              like_count: r.user_liked ? r.like_count - 1 : r.like_count + 1,
            }
          : r,
      );
      mutate(
        discussion ? { discussion, replies: optimistic } : undefined,
        false,
      );

      const result = await toggleLike(
        replyId,
        "discussion_reply",
        reply.user_liked,
      );
      if (result === null) {
        mutate();
        setShowAuthModal(true);
        return;
      }
      if (result.likeCount === -1) {
        mutate();
        return;
      }
      const confirmed = replies.map((r) =>
        r.id === replyId
          ? { ...r, user_liked: result.liked, like_count: result.likeCount }
          : r,
      );
      mutate(
        discussion ? { discussion, replies: confirmed } : undefined,
        false,
      );
    },
    [discussion, replies, mutate],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-body text-[13px] text-aura-muted2 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to discussions
        </button>
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="h-6 w-3/4 rounded bg-aura-bg3" />
          <div className="h-20 rounded bg-aura-bg3" />
          <div className="h-12 rounded bg-aura-bg3" />
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-body text-[13px] text-aura-muted2 transition-colors hover:text-white"
        >
          <ArrowLeft size={14} />
          Back to discussions
        </button>
        <p className="py-8 text-center font-body text-[13px] text-aura-muted2">
          Discussion not found
        </p>
      </div>
    );
  }

  const authorSlug = discussion.author?.handle ?? discussion.author_id;

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 self-start font-body text-[13px] text-aura-muted2 transition-colors hover:text-white"
      >
        <ArrowLeft size={14} />
        Back to discussions
      </button>

      {/* Discussion body */}
      <div className="flex flex-col gap-4 rounded-lg bg-aura-bg3 p-6">
        <h2 className="font-body text-[18px] font-bold tracking-[-0.36px] text-white">
          {discussion.title}
        </h2>

        <div className="flex items-center gap-3">
          <Link
            href={`/u/${authorSlug}`}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            {discussion.author?.avatar_url ? (
              <div className="relative h-6 w-6 overflow-hidden rounded-full">
                <Image
                  src={discussion.author.avatar_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-aura-bg4 font-body text-[9px] font-bold text-aura-muted2">
                {(discussion.author?.display_name ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
            <span className="font-body text-[13px] font-bold text-white">
              {discussion.author?.display_name ?? "Unknown"}
            </span>
          </Link>
          <span className="font-mono text-[10px] text-aura-muted">
            {getRelativeTime(discussion.created_at)}
          </span>
        </div>

        <p className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-white/80">
          {discussion.body}
        </p>
      </div>

      {/* Replies */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </span>

        {replies.length === 0 ? (
          <p className="py-4 text-center font-body text-[12px] text-aura-muted">
            No replies yet. Be the first to respond.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {replies.map((reply) => {
              const replyAuthorSlug =
                reply.author?.handle ?? reply.author_id;
              return (
                <div
                  key={reply.id}
                  className="flex gap-3 rounded-lg bg-aura-bg3 p-4"
                >
                  <Link
                    href={`/u/${replyAuthorSlug}`}
                    className="shrink-0"
                  >
                    {reply.author?.avatar_url ? (
                      <div className="relative h-7 w-7 overflow-hidden rounded-full">
                        <Image
                          src={reply.author.avatar_url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aura-bg4 font-body text-[9px] font-bold text-aura-muted2">
                        {(reply.author?.display_name ?? "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/u/${replyAuthorSlug}`}
                        className="font-body text-[13px] font-bold text-white hover:text-aura-orange transition-colors"
                      >
                        {reply.author?.display_name ?? "Unknown"}
                      </Link>
                      <span className="font-mono text-[10px] text-aura-muted">
                        {getRelativeTime(reply.created_at)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap font-body text-[12px] leading-relaxed text-white/80">
                      {reply.body}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <LikeButton
                      liked={reply.user_liked}
                      count={reply.like_count}
                      onClick={() => handleReplyLike(reply.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply form */}
      {user ? (
        <DiscussionReplyForm
          discussionId={discussionId}
          onReplySubmitted={() => mutate()}
        />
      ) : (
        <div className="flex items-center justify-center rounded-lg border border-aura-border bg-aura-bg3 py-4">
          <Link
            href="/login"
            className="font-body text-[13px] font-semibold text-aura-orange transition-colors hover:text-aura-orange-hover"
          >
            Log in to reply
          </Link>
        </div>
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

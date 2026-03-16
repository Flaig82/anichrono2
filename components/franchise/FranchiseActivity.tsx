"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  GitPullRequestArrow,
  Check,
  Loader2,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import { useDitherHover } from "@/hooks/use-dither-hover";
import { getRelativeTime } from "@/lib/utils";
import AuthModal from "@/components/shared/AuthModal";
import type { EntryData } from "@/types/proposal";
import ProposalSheet from "./ProposalSheet";

interface ActivityProposal {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  vote_score: number;
  created_at: string;
  applied_at: string | null;
  like_count: number;
  user_liked: boolean;
  author?: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
  };
}

interface ActivityData {
  pending: ActivityProposal[];
  recent: ActivityProposal[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-10"
      style={{
        backgroundImage: "url(/images/pattern.png)",
        backgroundRepeat: "repeat",
      }}
    />
  );
}

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
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
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

function ActivityCard({
  proposal,
  onClick,
  onLike,
}: {
  proposal: ActivityProposal;
  onClick?: () => void;
  onLike?: () => void;
}) {
  const { containerRef, canvasRef } = useDitherHover();

  const isApplied = proposal.applied_at != null;
  const timestamp = isApplied
    ? getRelativeTime(proposal.applied_at!)
    : getRelativeTime(proposal.created_at);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className={`relative flex flex-col gap-3.5 overflow-hidden rounded-lg p-5${onClick ? " cursor-pointer transition-colors hover:bg-white/[0.03]" : ""}`}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 rounded-lg"
      />
      <PatternOverlay />

      {/* Content */}
      <div className="flex items-start gap-3.5">
        {/* Icon */}
        <div className="shrink-0 pt-0.5">
          {isApplied ? (
            <Check size={16} className="text-emerald-400" />
          ) : (
            <GitPullRequestArrow size={16} className="text-aura-muted2" />
          )}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="font-body text-[14px] font-bold tracking-[-0.28px] text-white">
            {proposal.title}
          </p>
          {proposal.description && (
            <p className="mt-1 font-body text-[12px] tracking-[-0.12px] text-white/70">
              {proposal.description.length > 80
                ? `${proposal.description.slice(0, 80)}...`
                : proposal.description}
            </p>
          )}
        </div>

      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Footer */}
      <div className="flex items-center gap-2.5">
        <span className="flex-1 font-body text-[12px] tracking-[-0.12px] text-white/50">
          {timestamp}
          {proposal.author && (
            <>
              {" "}
              &middot;{" "}
              <Link
                href={`/u/${proposal.author.handle ?? proposal.author_id}`}
                className="text-white/30 hover:text-white/60 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {proposal.author.display_name}
              </Link>
            </>
          )}
        </span>

        {!onClick && onLike && (
          <LikeButton
            liked={proposal.user_liked}
            count={proposal.like_count}
            onClick={onLike}
          />
        )}
      </div>
    </div>
  );
}

interface FranchiseActivityProps {
  franchiseId: string;
  franchiseTitle: string;
  currentEntries?: EntryData[];
}

export default function FranchiseActivity({
  franchiseId,
  franchiseTitle,
  currentEntries = [],
}: FranchiseActivityProps) {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(
    null,
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { data, isLoading, mutate } = useSWR<ActivityData>(
    `/api/franchise/${franchiseId}/activity`,
    fetcher,
  );

  const pending = data?.pending ?? [];
  const recent = data?.recent ?? [];
  const hasContent = pending.length > 0 || recent.length > 0;

  const handleLike = useCallback(
    async (proposalId: string) => {
      if (!data) return;
      const proposal = data.recent.find((p) => p.id === proposalId);
      if (!proposal) return;

      // Optimistic update
      const optimisticRecent = data.recent.map((p) =>
        p.id === proposalId
          ? {
              ...p,
              user_liked: !p.user_liked,
              like_count: p.user_liked ? p.like_count - 1 : p.like_count + 1,
            }
          : p,
      );
      mutate({ ...data, recent: optimisticRecent }, false);

      try {
        const res = proposal.user_liked
          ? await fetch(`/api/activity/${proposalId}/like?item_type=proposal`, { method: "DELETE" })
          : await fetch(`/api/activity/${proposalId}/like`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ item_type: "proposal" }),
            });

        if (res.status === 401) {
          // Revert and show auth modal
          mutate(data, false);
          setShowAuthModal(true);
          return;
        }

        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error ?? "Too many requests. Slow down.");
          mutate(data, false);
          return;
        }

        // Revalidate from server
        mutate();
      } catch {
        mutate(data, false);
      }
    },
    [data, mutate],
  );

  return (
    <div className="flex flex-col gap-2 pt-2">
      {/* Franchise stats card */}
      <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg bg-aura-bg3 p-5">
        <PatternOverlay />
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-aura-orange" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Franchise Activity
          </span>
        </div>
        <p className="font-body text-[16px] font-bold tracking-[-0.32px] text-white">
          {franchiseTitle}
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center gap-2 py-12">
          <Loader2 size={16} className="animate-spin text-aura-muted" />
          <span className="font-body text-[11px] text-aura-muted">
            Loading activity...
          </span>
        </div>
      ) : !hasContent ? (
        <div className="flex flex-col items-center gap-2 rounded-lg py-12">
          <span className="font-body text-[12px] text-aura-muted">
            No recent activity
          </span>
        </div>
      ) : (
        <>
          {/* Pending Updates */}
          {pending.length > 0 && (
            <>
              <div className="relative overflow-hidden rounded-lg px-5 pb-2 pt-5">
                <PatternOverlay />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                  Pending Updates
                </span>
              </div>
              {pending.map((p) => (
                <ActivityCard
                  key={p.id}
                  proposal={p}
                  onClick={() => setSelectedProposalId(p.id)}
                />
              ))}
            </>
          )}

          {/* Recent Updates */}
          {recent.length > 0 && (
            <>
              <div className="relative mt-4 overflow-hidden rounded-lg px-5 pb-2 pt-5">
                <PatternOverlay />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                  Recent Updates
                </span>
              </div>
              {recent.map((p) => (
                <ActivityCard
                  key={p.id}
                  proposal={p}
                  onLike={() => handleLike(p.id)}
                />
              ))}
            </>
          )}
        </>
      )}

      {/* Proposal detail sheet */}
      {selectedProposalId && (
        <ProposalSheet
          proposalId={selectedProposalId}
          currentEntries={currentEntries}
          onClose={() => setSelectedProposalId(null)}
          onWithdraw={() => mutate()}
        />
      )}

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

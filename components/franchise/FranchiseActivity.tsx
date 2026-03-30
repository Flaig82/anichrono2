"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  GitPullRequestArrow,
  Check,
  Loader2,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";
import { toggleLike } from "@/lib/toggle-like";
import LikeButton from "@/components/shared/LikeButton";
import { getRelativeTime, trackAmazonClick } from "@/lib/utils";
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

const AMAZON_TAG = "animechrono-20";

function buildShopLinks(franchiseTitle: string) {
  const title = franchiseTitle.replace(/\s*\(.*?\)\s*/g, "").trim();
  return [
    { label: "Manga", query: `${title} manga` },
    { label: "Blu-ray", query: `${title} anime blu-ray` },
    { label: "Figures", query: `${title} anime figure` },
  ];
}

function buildAmazonUrl(query: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_TAG}`;
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
    { revalidateOnFocus: false },
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

      const result = await toggleLike(proposalId, "proposal", proposal.user_liked);
      if (result === null) {
        mutate(data, false);
        setShowAuthModal(true);
        return;
      }
      if (result.likeCount === -1) {
        mutate(data, false);
        return;
      }
      const confirmedRecent = data.recent.map((p) =>
        p.id === proposalId
          ? { ...p, user_liked: result.liked, like_count: result.likeCount }
          : p,
      );
      mutate({ ...data, recent: confirmedRecent }, false);
    },
    [data, mutate],
  );

  return (
    <div className="flex flex-col gap-2 pt-2">
      {/* Shop card */}
      <div className="relative flex flex-col gap-3 overflow-hidden rounded-lg bg-aura-bg3 p-5">
        <PatternOverlay />
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-aura-orange" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
            Shop
          </span>
        </div>
          <div className="flex flex-col gap-0.5">
            {buildShopLinks(franchiseTitle).map((product) => (
              <a
                key={product.label}
                href={buildAmazonUrl(product.query)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackAmazonClick(`${franchiseTitle} - ${product.label}`)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.04]"
              >
                <ShoppingBag size={14} className="shrink-0 text-aura-muted" />
                <p className="min-w-0 flex-1 font-body text-[12px] font-bold text-white">
                  {franchiseTitle} {product.label}
                </p>
                <ExternalLink size={11} className="shrink-0 text-aura-muted/50" />
              </a>
            ))}
          </div>
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

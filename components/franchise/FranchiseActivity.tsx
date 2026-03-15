"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  GitPullRequestArrow,
  Check,
  Loader2,
  ChevronUp,
  Bookmark,
  Heart,
} from "lucide-react";
import { useDitherHover } from "@/hooks/use-dither-hover";
import type { EntryData } from "@/types/proposal";
import ProposalSheet from "./ProposalSheet";

interface ActivityProposal {
  id: string;
  title: string;
  description: string | null;
  vote_score: number;
  created_at: string;
  applied_at: string | null;
  author?: {
    display_name: string;
    avatar_url: string | null;
  };
}

interface ActivityData {
  pending: ActivityProposal[];
  recent: ActivityProposal[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

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
}: {
  proposal: ActivityProposal;
  onClick?: () => void;
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

        {/* Vote score badge (pending only) */}
        {!isApplied && (
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-white/5 px-2 py-1">
            <ChevronUp size={12} className="text-aura-muted2" />
            <span className="font-mono text-[11px] font-semibold text-aura-muted2">
              {proposal.vote_score}
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-white/[0.06]" />

      {/* Footer */}
      <div className="flex items-center gap-2.5">
        <span className="flex-1 font-body text-[12px] tracking-[-0.12px] text-white/50">
          {timestamp}
          {proposal.author && (
            <span className="text-white/30">
              {" "}
              &middot; {proposal.author.display_name}
            </span>
          )}
        </span>

        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-aura-bg3/50 transition-colors hover:bg-aura-bg3">
          <Bookmark size={12} className="text-white/50" />
        </button>
        <button className="flex h-6 w-6 items-center justify-center rounded-full bg-aura-bg3/50 transition-colors hover:bg-aura-bg3">
          <Heart size={12} className="text-white/50" />
        </button>
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
  const { data, isLoading, mutate } = useSWR<ActivityData>(
    `/api/franchise/${franchiseId}/activity`,
    fetcher,
  );

  const pending = data?.pending ?? [];
  const recent = data?.recent ?? [];
  const hasContent = pending.length > 0 || recent.length > 0;

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
              <div className="relative overflow-hidden rounded-lg px-5 pb-2 pt-5">
                <PatternOverlay />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                  Recent Updates
                </span>
              </div>
              {recent.map((p) => (
                <ActivityCard key={p.id} proposal={p} />
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
    </div>
  );
}

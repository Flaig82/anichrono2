"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight, User } from "lucide-react";
import type { OrderProposal, EntryData } from "@/types/proposal";
import VoteButtons from "./VoteButtons";
import ProposalDiffView from "./ProposalDiffView";

interface ProposalCardProps {
  proposal: OrderProposal;
  currentEntries: EntryData[];
  isOwnProposal: boolean;
  onWithdraw?: (proposalId: string) => void;
}

export default function ProposalCard({
  proposal,
  currentEntries,
  isOwnProposal,
  onWithdraw,
}: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  async function handleWithdraw() {
    if (!onWithdraw || withdrawing) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/proposal/${proposal.id}/withdraw`, {
        method: "POST",
      });
      if (res.ok) {
        onWithdraw(proposal.id);
      }
    } finally {
      setWithdrawing(false);
    }
  }

  const timeAgo = getRelativeTime(proposal.created_at);

  return (
    <div className="rounded-xl border border-aura-border bg-[#212121]">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Vote buttons */}
        <VoteButtons
          proposalId={proposal.id}
          initialScore={proposal.vote_score}
          initialUserVote={proposal.user_vote ?? null}
          disabled={isOwnProposal}
        />

        {/* Content */}
        <div className="flex flex-1 flex-col gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-left"
          >
            {expanded ? (
              <ChevronDown size={14} className="shrink-0 text-aura-muted" />
            ) : (
              <ChevronRight size={14} className="shrink-0 text-aura-muted" />
            )}
            <span className="font-body text-[14px] font-bold text-white">
              {proposal.title}
            </span>
          </button>

          <div className="flex items-center gap-2 pl-5">
            {/* Author */}
            <div className="flex items-center gap-1.5">
              {proposal.author?.avatar_url ? (
                <Image
                  src={proposal.author.avatar_url}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 rounded-full"
                />
              ) : (
                <User size={12} className="text-aura-muted" />
              )}
              <span className="font-body text-[11px] text-aura-muted2">
                {proposal.author?.display_name ?? "Unknown"}
              </span>
            </div>

            <span className="text-aura-muted">·</span>
            <span className="font-body text-[11px] text-aura-muted">
              {timeAgo}
            </span>

            {isOwnProposal && (
              <>
                <span className="text-aura-muted">·</span>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="font-body text-[11px] text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {withdrawing ? "Withdrawing..." : "Withdraw"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expanded diff view */}
      {expanded && (
        <div className="border-t border-aura-border px-4 py-3">
          {proposal.description && (
            <p className="mb-3 font-body text-[13px] text-aura-muted2">
              {proposal.description}
            </p>
          )}
          <ProposalDiffView
            currentEntries={currentEntries}
            proposedEntries={proposal.proposed_entries}
          />
        </div>
      )}
    </div>
  );
}

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

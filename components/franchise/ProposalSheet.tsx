"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import useSWR from "swr";
import { X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { OrderProposal, EntryData } from "@/types/proposal";
import VoteButtons from "./VoteButtons";
import ProposalDiffView from "./ProposalDiffView";

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

const ERA_COLORS: Record<string, string> = {
  initiate: "text-aura-muted2",
  wanderer: "text-blue-400",
  adept: "text-purple-400",
  ascendant: "text-amber-400",
};

interface ProposalSheetProps {
  proposalId: string;
  currentEntries: EntryData[];
  onClose: () => void;
  onWithdraw?: (proposalId: string) => void;
}

export default function ProposalSheet({
  proposalId,
  currentEntries,
  onClose,
  onWithdraw,
}: ProposalSheetProps) {
  const { user } = useAuth();
  const { data: proposal, isLoading } = useSWR<OrderProposal>(
    `/api/proposal/${proposalId}`,
    fetcher,
  );
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const isOwnProposal = user?.id === proposal?.author_id;

  async function handleWithdraw() {
    if (!proposal || isWithdrawing) return;
    setIsWithdrawing(true);
    const res = await fetch(`/api/proposal/${proposal.id}/withdraw`, {
      method: "POST",
    });
    if (res.ok) {
      onWithdraw?.(proposal.id);
      onClose();
    }
    setIsWithdrawing(false);
  }

  // Lock body scroll while sheet is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative flex w-full max-w-lg flex-col bg-[#1a1a1e] shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-aura-border px-5 py-4">
          <h2 className="font-body text-[16px] font-bold text-white">
            Proposal Details
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-aura-muted transition-colors hover:bg-white/5 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <Loader2
                size={20}
                className="animate-spin text-aura-muted"
              />
              <span className="font-body text-[12px] text-aura-muted">
                Loading proposal...
              </span>
            </div>
          ) : !proposal ? (
            <div className="flex flex-col items-center gap-2 py-24">
              <span className="font-body text-[13px] text-aura-muted2">
                Proposal not found
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-5 p-5">
              {/* Title */}
              <h3 className="font-body text-[18px] font-bold tracking-[-0.36px] text-white">
                {proposal.title}
              </h3>

              {/* Author row */}
              <div className="flex items-center gap-3">
                {proposal.author?.avatar_url ? (
                  <img
                    src={proposal.author.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                    <span className="font-body text-[12px] font-bold text-white">
                      {proposal.author?.display_name?.charAt(0) ?? "?"}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-body text-[13px] font-bold text-white">
                    {proposal.author?.display_name ?? "Unknown"}
                  </span>
                  <span className="font-body text-[11px] text-aura-muted">
                    <span
                      className={
                        ERA_COLORS[proposal.author?.era ?? ""] ??
                        "text-aura-muted"
                      }
                    >
                      {proposal.author?.era
                        ? proposal.author.era.charAt(0).toUpperCase() +
                          proposal.author.era.slice(1)
                        : ""}
                    </span>
                    {" · "}
                    {getRelativeTime(proposal.created_at)}
                  </span>
                </div>
              </div>

              {/* Vote buttons */}
              <div className="flex items-center gap-3 rounded-lg border border-aura-border bg-white/[0.02] px-4 py-3">
                <VoteButtons
                  proposalId={proposal.id}
                  initialScore={proposal.vote_score}
                  initialUserVote={proposal.user_vote ?? null}
                  disabled={isOwnProposal}
                />
                <span className="flex-1 font-body text-[12px] text-aura-muted">
                  {isOwnProposal
                    ? "Your proposal"
                    : proposal.status === "open"
                      ? "Vote on this proposal"
                      : `Status: ${proposal.status}`}
                </span>
                {isOwnProposal && proposal.status === "open" && (
                  <button
                    onClick={handleWithdraw}
                    disabled={isWithdrawing}
                    className="rounded-md bg-red-600/20 px-3 py-1.5 font-body text-[12px] font-bold text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
                  >
                    {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                  </button>
                )}
              </div>

              {/* Description */}
              {proposal.description && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                    Description
                  </span>
                  <p className="font-body text-[13px] leading-relaxed text-aura-muted2">
                    {proposal.description}
                  </p>
                </div>
              )}

              {/* Diff view */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-aura-muted">
                  Proposed Changes
                </span>
                <div className="rounded-lg border border-aura-border bg-white/[0.02] p-3">
                  <ProposalDiffView
                    currentEntries={currentEntries}
                    proposedEntries={proposal.proposed_entries}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

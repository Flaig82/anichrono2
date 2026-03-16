"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import ProposalDiffView from "@/components/franchise/ProposalDiffView";
import type { EntryData, OrderProposal } from "@/types/proposal";

interface AdminProposal extends OrderProposal {
  franchise?: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
  };
}

function PatternOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl opacity-10"
      style={{ backgroundImage: "url(/images/pattern.png)", backgroundRepeat: "repeat" }}
    />
  );
}

export default function AdminProposalsPage() {
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentEntries, setCurrentEntries] = useState<
    Record<string, EntryData[]>
  >({});
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  // Fetch pending proposals (admin guard handled by layout)
  useEffect(() => {
    if (!profile?.is_admin) return;

    async function fetchProposals() {
      const res = await fetch("/api/admin/proposals");
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
      setIsLoading(false);
    }

    fetchProposals();
  }, [profile]);

  // Fetch current entries when expanding a proposal
  async function handleExpand(proposal: AdminProposal) {
    if (expandedId === proposal.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(proposal.id);

    if (!currentEntries[proposal.franchise_id]) {
      const res = await fetch(
        `/api/franchise/${proposal.franchise_id}/entries`,
      );
      if (res.ok) {
        const entries = await res.json();
        setCurrentEntries((prev) => ({
          ...prev,
          [proposal.franchise_id]: entries,
        }));
      }
    }
  }

  async function handleAction(proposalId: string, action: "approve" | "reject") {
    setActionInFlight(proposalId);

    const res = await fetch(`/api/admin/proposal/${proposalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      setProposals((prev) => prev.filter((p) => p.id !== proposalId));
      if (expandedId === proposalId) setExpandedId(null);
    }

    setActionInFlight(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="font-brand text-xl font-bold tracking-tight text-white"
          style={{ textShadow: "0 0 12px rgba(235, 99, 37, 0.5)" }}
        >
          Proposal Approval Queue
        </h1>
        <p className="mt-1 font-body text-[13px] tracking-[-0.26px] text-aura-muted2">
          All open and pending proposals. Admins can approve or reject without waiting for votes.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[80px] animate-pulse rounded-xl bg-aura-bg3" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="relative overflow-hidden rounded-xl bg-aura-bg3 px-6 py-12 text-center">
          <PatternOverlay />
          <p className="relative font-body text-[13px] text-aura-muted">
            No proposals pending approval.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="relative overflow-hidden rounded-xl bg-aura-bg3"
            >
              <PatternOverlay />
              {/* Header row */}
              <button
                onClick={() => handleExpand(proposal)}
                className="relative flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-body text-[14px] font-bold tracking-[-0.28px] text-white truncate">
                      {proposal.title}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] tracking-[0.15em] ${
                      proposal.status === "pending_approval"
                        ? "bg-amber-500/15 text-amber-400"
                        : "bg-white/[0.08] text-aura-muted2"
                    }`}>
                      {proposal.status === "pending_approval" ? "pending" : "open"} · {proposal.vote_score >= 0 ? "+" : ""}{proposal.vote_score} votes
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-[11px] text-white/50">
                    <span>{proposal.franchise?.title ?? "Unknown franchise"}</span>
                    <span className="text-aura-muted">·</span>
                    <Link
                      href={`/u/${proposal.author?.handle ?? proposal.author_id}`}
                      className="transition-colors hover:text-aura-orange"
                      onClick={(e) => e.stopPropagation()}
                    >
                      by {proposal.author?.display_name ?? "Unknown"}
                    </Link>
                    <span className="text-aura-muted">·</span>
                    <span>
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-aura-muted2 text-xs">
                  {expandedId === proposal.id ? "▲" : "▼"}
                </span>
              </button>

              {/* Expanded diff + actions */}
              {expandedId === proposal.id && (
                <div className="relative border-t border-white/[0.06] px-5 py-4">
                  {proposal.description && (
                    <p className="font-body text-[13px] tracking-[-0.26px] text-aura-muted2 mb-4">
                      {proposal.description}
                    </p>
                  )}

                  <div className="mb-4">
                    <ProposalDiffView
                      currentEntries={
                        currentEntries[proposal.franchise_id] ?? []
                      }
                      proposedEntries={proposal.proposed_entries}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAction(proposal.id, "approve")}
                      disabled={actionInFlight === proposal.id}
                      className="rounded-lg bg-emerald-500/15 px-4 py-2 font-body text-[13px] font-bold tracking-[-0.26px] text-emerald-400 transition-all hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      {actionInFlight === proposal.id
                        ? "Applying..."
                        : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(proposal.id, "reject")}
                      disabled={actionInFlight === proposal.id}
                      className="rounded-lg bg-red-500/10 px-4 py-2 font-body text-[13px] font-bold tracking-[-0.26px] text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

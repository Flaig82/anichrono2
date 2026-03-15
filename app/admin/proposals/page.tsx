"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function AdminProposalsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState<AdminProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentEntries, setCurrentEntries] = useState<
    Record<string, EntryData[]>
  >({});
  const [actionInFlight, setActionInFlight] = useState<string | null>(null);

  // Redirect non-admins (wait for profile to load before deciding)
  useEffect(() => {
    if (authLoading) return;
    // No user at all → redirect
    if (!profile) {
      // Give profile a moment to load (it fetches after auth resolves)
      const timeout = setTimeout(() => {
        const current = useAuth.getState().profile;
        if (!current?.is_admin) {
          router.replace("/");
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
    if (!profile.is_admin) {
      router.replace("/");
    }
  }, [authLoading, profile, router]);

  // Fetch pending proposals
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

  if (authLoading || !profile?.is_admin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-brand text-2xl font-bold text-white mb-1">
        Proposal Approval Queue
      </h1>
      <p className="font-body text-sm text-aura-muted2 mb-8">
        Proposals that reached the vote threshold and need admin review.
      </p>

      {isLoading ? (
        <div className="text-aura-muted2 font-body text-sm">Loading...</div>
      ) : proposals.length === 0 ? (
        <div className="rounded-lg border border-aura-border bg-aura-bg2 px-6 py-10 text-center">
          <p className="font-body text-sm text-aura-muted2">
            No proposals pending approval.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="rounded-lg border border-aura-border bg-aura-bg2"
            >
              {/* Header row */}
              <button
                onClick={() => handleExpand(proposal)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-bold text-white truncate">
                      {proposal.title}
                    </span>
                    <span className="shrink-0 rounded bg-aura-bg4 px-2 py-0.5 font-mono text-[10px] text-aura-muted2">
                      +{proposal.vote_score} votes
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-aura-muted">
                    <span>{proposal.franchise?.title ?? "Unknown franchise"}</span>
                    <span>·</span>
                    <Link
                      href={`/u/${proposal.author?.handle ?? proposal.author_id}`}
                      className="hover:text-aura-muted2 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      by {proposal.author?.display_name ?? "Unknown"}
                    </Link>
                    <span>·</span>
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
                <div className="border-t border-aura-border px-5 py-4">
                  {proposal.description && (
                    <p className="font-body text-sm text-aura-muted2 mb-4">
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
                      className="rounded-lg bg-emerald-600 px-4 py-2 font-body text-sm font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {actionInFlight === proposal.id
                        ? "Applying..."
                        : "Approve"}
                    </button>
                    <button
                      onClick={() => handleAction(proposal.id, "reject")}
                      disabled={actionInFlight === proposal.id}
                      className="rounded-lg bg-red-600/20 px-4 py-2 font-body text-sm font-bold text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
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

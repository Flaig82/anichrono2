"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/use-auth";
import type { OrderProposal, EntryData } from "@/types/proposal";
import ProposalCard from "./ProposalCard";

interface ProposalListProps {
  franchiseId: string;
  currentEntries: EntryData[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProposalList({
  franchiseId,
  currentEntries,
}: ProposalListProps) {
  const { user } = useAuth();

  const { data: proposals, mutate } = useSWR<OrderProposal[]>(
    `/api/franchise/${franchiseId}/proposals`,
    fetcher,
  );

  function handleWithdraw(proposalId: string) {
    mutate(
      (current) => current?.filter((p) => p.id !== proposalId),
      { revalidate: true },
    );
  }

  if (!proposals || proposals.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-body text-[10px] font-bold uppercase tracking-[0.15em] text-aura-muted">
        Proposed Edits
      </h3>

      <div className="flex flex-col gap-2">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            currentEntries={currentEntries}
            isOwnProposal={user?.id === proposal.author_id}
            onWithdraw={handleWithdraw}
          />
        ))}
      </div>
    </div>
  );
}

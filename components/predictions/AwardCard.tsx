"use client";

import { useState } from "react";
import Image from "next/image";
import AuthModal from "@/components/shared/AuthModal";
import type { Award, AwardNominee } from "@/types/prediction";

interface AwardCardProps {
  award: Award;
  isFromDb?: boolean;
}

export default function AwardCard({ award, isFromDb }: AwardCardProps) {
  const [votedNomineeId, setVotedNomineeId] = useState<string | null>(award.userVoteNomineeId);
  const [nominees, setNominees] = useState<AwardNominee[]>(award.nominees);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isLoading = isSubmitting;
  const totalVotes = nominees.reduce((sum, n) => sum + n.voteCount, 0);

  const handleVote = async (nominee: AwardNominee) => {
    if (!isFromDb) {
      // Mock mode — just toggle locally
      setVotedNomineeId((prev) => (prev === nominee.id ? null : nominee.id));
      return;
    }

    setIsSubmitting(true);

    const prevNomineeId = votedNomineeId;
    const prevNominees = nominees;

    if (prevNomineeId === nominee.id) {
      // Un-voting
      setVotedNomineeId(null);
      setNominees((prev) =>
        prev.map((n) => {
          if (n.id === nominee.id) {
            const newCount = Math.max(0, n.voteCount - 1);
            const newTotal = totalVotes - 1;
            return {
              ...n,
              voteCount: newCount,
              votePercent: newTotal > 0 ? Math.round((newCount / newTotal) * 1000) / 10 : 0,
            };
          }
          const newTotal = totalVotes - 1;
          return {
            ...n,
            votePercent: newTotal > 0 ? Math.round((n.voteCount / newTotal) * 1000) / 10 : 0,
          };
        }),
      );

      try {
        const res = await fetch(`/api/award/${award.id}/vote`, {
          method: "DELETE",
        });
        if (!res.ok) {
          setVotedNomineeId(prevNomineeId);
          setNominees(prevNominees);
        } else {
          const data = await res.json();
          applyNomineesFromApi(data.nominees);
          setVotedNomineeId(data.userVoteNomineeId);
        }
      } catch {
        setVotedNomineeId(prevNomineeId);
        setNominees(prevNominees);
      }
    } else {
      // Voting or changing vote
      setVotedNomineeId(nominee.id);

      // Optimistic: increment new, decrement old if changing
      setNominees((prev) => {
        const newTotal = prevNomineeId ? totalVotes : totalVotes + 1;
        return prev.map((n) => {
          let newCount = n.voteCount;
          if (n.id === nominee.id) newCount += 1;
          if (prevNomineeId && n.id === prevNomineeId) newCount = Math.max(0, newCount - 1);
          return {
            ...n,
            voteCount: newCount,
            votePercent: newTotal > 0 ? Math.round((newCount / newTotal) * 1000) / 10 : 0,
          };
        });
      });

      try {
        const res = await fetch(`/api/award/${award.id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nominee_id: nominee.id }),
        });
        if (res.status === 401) {
          setVotedNomineeId(prevNomineeId);
          setNominees(prevNominees);
          setShowAuthModal(true);
          setIsSubmitting(false);
          return;
        }
        if (!res.ok) {
          setVotedNomineeId(prevNomineeId);
          setNominees(prevNominees);
        } else {
          const data = await res.json();
          if (data.nominees) {
            applyNomineesFromApi(data.nominees);
          }
          if (data.userVoteNomineeId !== undefined) {
            setVotedNomineeId(data.userVoteNomineeId);
          }
        }
      } catch {
        setVotedNomineeId(prevNomineeId);
        setNominees(prevNominees);
      }
    }

    setIsSubmitting(false);
  };

  function applyNomineesFromApi(
    apiNominees: Array<{
      id: string;
      anime_id: number;
      title: string;
      cover_image_url: string | null;
      votes: number;
    }>,
  ) {
    const total = apiNominees.reduce((sum, n) => sum + n.votes, 0);
    setNominees(
      apiNominees.map((n) => ({
        id: n.id,
        animeId: n.anime_id,
        title: n.title,
        coverImageUrl: n.cover_image_url,
        votePercent: total > 0 ? Math.round((n.votes / total) * 1000) / 10 : 0,
        voteCount: n.votes,
      })),
    );
  }

  // Find the leader (only if there are actual votes)
  const leader = nominees.length > 0 && totalVotes > 0
    ? nominees.reduce((max, n) => (n.voteCount > max.voteCount ? n : max), nominees[0]!)
    : null;
  const leaderId = leader && leader.voteCount > 0 ? leader.id : null;

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-[#212121] p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-body text-[15px] font-bold tracking-[-0.3px] text-white">
          <span className="mr-1.5">{award.emoji}</span>
          {award.label}
        </h3>
        <span className="font-mono text-[10px] text-aura-muted">
          {totalVotes.toLocaleString()} votes
        </span>
      </div>

      {/* Nominee grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {nominees.map((nominee) => {
          const isVoted = votedNomineeId === nominee.id;
          const isLeader = nominee.id === leaderId;

          return (
            <button
              key={nominee.id}
              onClick={() => handleVote(nominee)}
              disabled={isLoading}
              className={`group flex items-center gap-2.5 rounded-lg p-2 text-left transition-all ${
                isVoted
                  ? "bg-aura-orange/10 ring-1 ring-aura-orange/40"
                  : "bg-white/[0.03] hover:bg-white/[0.06]"
              } ${isLoading ? "opacity-70" : ""}`}
            >
              {/* Cover */}
              <div className="relative h-[52px] w-[38px] shrink-0 overflow-hidden rounded">
                {nominee.coverImageUrl ? (
                  <Image
                    src={nominee.coverImageUrl}
                    alt={nominee.title}
                    fill
                    className="object-cover"
                    sizes="38px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-aura-bg3">
                    <span className="text-[8px] text-aura-muted">?</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-1">
                  <span className="line-clamp-1 font-body text-[12px] font-semibold leading-tight text-white">
                    {nominee.title}
                  </span>
                  {isLeader && !isVoted && (
                    <span className="shrink-0 rounded-full bg-aura-orange/15 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-aura-orange">
                      Leading
                    </span>
                  )}
                  {isVoted && (
                    <span className="shrink-0 rounded-full bg-aura-orange/20 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-aura-orange">
                      Voted
                    </span>
                  )}
                </div>

                {/* Vote bar */}
                <div className="flex flex-col gap-0.5">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isVoted
                          ? "bg-aura-orange"
                          : isLeader
                            ? "bg-aura-orange/60"
                            : "bg-white/25"
                      }`}
                      style={{ width: `${nominee.votePercent}%` }}
                    />
                  </div>
                  <span className="font-mono text-[9px] text-aura-muted2">
                    {nominee.votePercent}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

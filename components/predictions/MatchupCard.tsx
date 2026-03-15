"use client";

import { useState } from "react";
import Image from "next/image";
import { useDitherHover } from "@/hooks/use-dither-hover";
import AuthModal from "@/components/shared/AuthModal";
import type { Matchup } from "@/types/prediction";

interface MatchupCardProps {
  matchup: Matchup;
  isFromDb?: boolean;
}

function VoteSide({
  anime,
  side,
  votes,
  totalVotes,
  isSelected,
  isWinner,
  isLoser,
  isActive,
  isLoading,
  onVote,
}: {
  anime: { animeId: number; title: string; coverImageUrl: string | null };
  side: "a" | "b";
  votes: number;
  totalVotes: number;
  isSelected: boolean;
  isWinner: boolean;
  isLoser: boolean;
  isActive: boolean;
  isLoading: boolean;
  onVote: (side: "a" | "b") => void;
}) {
  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 50;

  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2.5 rounded-lg p-3 transition-all ${
        isWinner
          ? "bg-aura-orange/10 ring-1 ring-aura-orange/40"
          : isLoser
            ? "opacity-40"
            : isSelected
              ? "bg-oracle/10 ring-1 ring-oracle/40"
              : ""
      }`}
    >
      {/* Cover image */}
      <div className="relative h-[112px] w-[80px] shrink-0 overflow-hidden rounded-lg">
        {anime.coverImageUrl ? (
          <Image
            src={anime.coverImageUrl}
            alt={anime.title}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-aura-bg3">
            <span className="font-mono text-[9px] text-aura-muted">No img</span>
          </div>
        )}
        {isWinner && (
          <div className="absolute inset-x-0 bottom-0 bg-aura-orange/90 py-0.5 text-center font-mono text-[9px] font-bold uppercase tracking-wider text-white">
            Winner
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="line-clamp-2 text-center font-body text-[13px] font-bold leading-tight tracking-[-0.26px] text-white">
        {anime.title}
      </h4>

      {/* Vote bar */}
      <div className="flex w-full flex-col gap-1">
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all ${
              isWinner
                ? "bg-aura-orange"
                : isSelected
                  ? "bg-oracle"
                  : "bg-white/30"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-center font-mono text-[10px] text-aura-muted2">
          {pct}% ({votes.toLocaleString()})
        </span>
      </div>

      {/* Vote button */}
      {isActive && (
        <button
          onClick={() => onVote(side)}
          disabled={isLoading}
          className={`w-full rounded-lg px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] transition-all ${
            isSelected
              ? "bg-oracle text-white"
              : "border border-white/[0.07] bg-white/[0.04] text-aura-muted2 hover:border-oracle/40 hover:text-oracle"
          } ${isLoading ? "opacity-50" : ""}`}
        >
          {isLoading ? "..." : isSelected ? "Voted" : "Vote"}
        </button>
      )}
    </div>
  );
}

export default function MatchupCard({ matchup, isFromDb }: MatchupCardProps) {
  const { containerRef, canvasRef } = useDitherHover();
  const [userVote, setUserVote] = useState<"a" | "b" | null>(matchup.userVote);
  const [votesA, setVotesA] = useState(matchup.votesA);
  const [votesB, setVotesB] = useState(matchup.votesB);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isActive = matchup.status === "active";
  const isCompleted = matchup.status === "completed";
  const totalVotes = votesA + votesB;
  const isLoading = isSubmitting;

  const roundLabel = matchup.round === "quarterfinal"
    ? `Quarterfinal ${matchup.position}`
    : matchup.round === "semifinal"
      ? `Semifinal ${matchup.position}`
      : "Grand Final";

  const handleVote = async (side: "a" | "b") => {
    if (!isFromDb) {
      // Mock mode — just toggle locally
      setUserVote((prev) => (prev === side ? null : side));
      return;
    }

    setIsSubmitting(true);

    // Optimistic update
    const prevVote = userVote;
    const prevVotesA = votesA;
    const prevVotesB = votesB;

    if (prevVote === side) {
      // Un-voting
      setUserVote(null);
      setVotesA(side === "a" ? votesA - 1 : votesA);
      setVotesB(side === "b" ? votesB - 1 : votesB);

      try {
        const res = await fetch(`/api/matchup/${matchup.id}/vote`, {
          method: "DELETE",
        });
        if (!res.ok) {
          // Revert on error
          setUserVote(prevVote);
          setVotesA(prevVotesA);
          setVotesB(prevVotesB);
        } else {
          const data = await res.json();
          setVotesA(data.votes_a);
          setVotesB(data.votes_b);
        }
      } catch {
        setUserVote(prevVote);
        setVotesA(prevVotesA);
        setVotesB(prevVotesB);
      }
    } else {
      // Voting or changing vote
      setUserVote(side);
      if (prevVote) {
        // Changing: swing from old side to new
        setVotesA(side === "a" ? votesA + 1 : votesA - 1);
        setVotesB(side === "b" ? votesB + 1 : votesB - 1);
      } else {
        setVotesA(side === "a" ? votesA + 1 : votesA);
        setVotesB(side === "b" ? votesB + 1 : votesB);
      }

      try {
        const res = await fetch(`/api/matchup/${matchup.id}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vote: side }),
        });
        if (res.status === 401) {
          setUserVote(prevVote);
          setVotesA(prevVotesA);
          setVotesB(prevVotesB);
          setShowAuthModal(true);
          setIsSubmitting(false);
          return;
        }
        if (!res.ok) {
          setUserVote(prevVote);
          setVotesA(prevVotesA);
          setVotesB(prevVotesB);
        } else {
          const data = await res.json();
          setVotesA(data.votes_a);
          setVotesB(data.votes_b);
          setUserVote(data.userVote);
        }
      } catch {
        setUserVote(prevVote);
        setVotesA(prevVotesA);
        setVotesB(prevVotesB);
      }
    }

    setIsSubmitting(false);
  };

  return (
    <div
      ref={isActive ? containerRef : undefined}
      className={`relative overflow-hidden rounded-xl bg-[#212121] p-1 transition-all duration-200 ${
        isActive ? "hover:scale-[1.01]" : ""
      }`}
    >
      {isActive && (
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 z-10 rounded-xl"
        />
      )}

      <div className="relative flex flex-col gap-3 overflow-hidden rounded-lg p-4">
        {/* Round label */}
        <div className="flex items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-aura-muted">
            {roundLabel}
          </span>
        </div>

        {/* Two sides + VS */}
        <div className="flex items-start gap-2">
          <VoteSide
            anime={matchup.animeA}
            side="a"
            votes={votesA}
            totalVotes={totalVotes}
            isSelected={userVote === "a"}
            isWinner={isCompleted && matchup.winnerId === matchup.animeA.animeId}
            isLoser={isCompleted && matchup.winnerId !== matchup.animeA.animeId}
            isActive={isActive}
            isLoading={isLoading}
            onVote={handleVote}
          />

          {/* VS badge */}
          <div className="flex shrink-0 flex-col items-center justify-center pt-12">
            <span className="rounded-full bg-oracle/20 px-2.5 py-1 font-mono text-[11px] font-bold text-oracle">
              VS
            </span>
          </div>

          <VoteSide
            anime={matchup.animeB}
            side="b"
            votes={votesB}
            totalVotes={totalVotes}
            isSelected={userVote === "b"}
            isWinner={isCompleted && matchup.winnerId === matchup.animeB.animeId}
            isLoser={isCompleted && matchup.winnerId !== matchup.animeB.animeId}
            isActive={isActive}
            isLoading={isLoading}
            onVote={handleVote}
          />
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

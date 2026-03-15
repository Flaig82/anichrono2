"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface VoteButtonsProps {
  proposalId: string;
  initialScore: number;
  initialUserVote: number | null;
  disabled?: boolean;
}

export default function VoteButtons({
  proposalId,
  initialScore,
  initialUserVote,
  disabled = false,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<number | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  async function handleVote(value: 1 | -1) {
    if (isVoting || disabled) return;

    if (!user) {
      router.push("/login");
      return;
    }

    setIsVoting(true);
    try {
      if (userVote === value) {
        // Remove vote
        const res = await fetch(`/api/proposal/${proposalId}/vote`, {
          method: "DELETE",
        });
        if (res.ok) {
          setScore((s) => s - value);
          setUserVote(null);
        }
      } else {
        // Cast or change vote
        const res = await fetch(`/api/proposal/${proposalId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });
        if (res.ok) {
          const data = await res.json();
          setScore(data.vote_score);
          setUserVote(value);
        }
      }
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={disabled || isVoting}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          userVote === 1
            ? "bg-emerald-500/20 text-emerald-400"
            : "text-aura-muted hover:bg-white/5 hover:text-white",
          (disabled || isVoting) && "cursor-not-allowed opacity-50",
        )}
        title="Upvote"
      >
        <ChevronUp size={16} />
      </button>

      <span
        className={cn(
          "min-w-[24px] text-center font-body text-xs font-bold tabular-nums",
          score > 0 && "text-emerald-400",
          score < 0 && "text-red-400",
          score === 0 && "text-aura-muted2",
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={disabled || isVoting}
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
          userVote === -1
            ? "bg-red-500/20 text-red-400"
            : "text-aura-muted hover:bg-white/5 hover:text-white",
          (disabled || isVoting) && "cursor-not-allowed opacity-50",
        )}
        title="Downvote"
      >
        <ChevronDown size={16} />
      </button>
    </div>
  );
}

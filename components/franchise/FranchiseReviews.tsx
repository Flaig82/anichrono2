"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Star, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface ReviewAuthor {
  display_name: string | null;
  handle: string | null;
  avatar_url: string | null;
}

interface Review {
  id: string;
  body: string;
  score: number;
  word_count: number;
  upvotes: number;
  created_at: string;
  user_id: string;
  users: ReviewAuthor;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SCORE_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

interface FranchiseReviewsProps {
  franchiseId: string;
}

export default function FranchiseReviews({ franchiseId }: FranchiseReviewsProps) {
  const { user, refreshProfile } = useAuth();
  const { mutate: globalMutate } = useSWRConfig();
  const { data: reviews, mutate } = useSWR<Review[]>(
    `/api/review?franchise_id=${franchiseId}`,
    fetcher,
  );

  const [body, setBody] = useState("");
  const [score, setScore] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [auraFlash, setAuraFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasReviewed = reviews?.some((r) => r.user_id === user?.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ franchise_id: franchiseId, body, score }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === "string" ? data.error : "Failed to submit review");
        return;
      }

      setBody("");
      setScore(7);
      setAuraFlash(true);
      setTimeout(() => setAuraFlash(false), 3000);
      mutate();
      if (user) globalMutate(`user-aura-${user.id}`);
      refreshProfile();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Scholar aura flash */}
      {auraFlash && (
        <div className="flex items-center gap-2 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-3">
          <span className="font-mono text-[13px] font-semibold text-[#8B5CF6]">
            +20 Scholar Aura earned
          </span>
        </div>
      )}

      {/* Write a review form */}
      {user && !hasReviewed && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-aura-border bg-[#212121] p-5">
          <h3 className="font-body text-[14px] font-bold text-white">Write a Review</h3>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts (minimum 50 characters)..."
            className="mt-3 w-full resize-none rounded-lg border border-aura-border bg-[#1a1a1e] px-4 py-3 font-body text-[13px] text-white placeholder:text-aura-muted focus:border-aura-orange/50 focus:outline-none"
            rows={4}
          />

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="font-mono text-[11px] uppercase tracking-[0.15em] text-aura-muted">
                Score
              </label>
              <select
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="rounded-lg border border-aura-border bg-[#1a1a1e] px-3 py-1.5 font-mono text-[13px] text-white focus:border-aura-orange/50 focus:outline-none"
              >
                {SCORE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.toFixed(1)}
                  </option>
                ))}
              </select>
              <span className="font-mono text-[11px] text-aura-muted">/ 10</span>
            </div>

            <button
              type="submit"
              disabled={submitting || body.length < 50}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 font-body text-[13px] font-bold text-white transition-colors",
                submitting || body.length < 50
                  ? "cursor-not-allowed bg-[rgba(49,49,49,0.6)] text-aura-muted"
                  : "bg-aura-orange hover:bg-aura-orange-hover",
              )}
            >
              <Send size={14} />
              Submit Review
            </button>
          </div>

          {body.length > 0 && body.length < 50 && (
            <p className="mt-2 font-mono text-[11px] text-aura-muted">
              {50 - body.length} more characters needed
            </p>
          )}

          {error && (
            <p className="mt-2 font-mono text-[11px] text-red-400">{error}</p>
          )}
        </form>
      )}

      {/* Review list */}
      {reviews && reviews.length > 0 ? (
        <div className="flex flex-col gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-aura-border bg-[#212121] p-5"
            >
              <div className="flex items-center gap-3">
                {review.users.avatar_url ? (
                  <img
                    src={review.users.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1e] font-body text-[12px] font-bold text-aura-muted">
                    {(review.users.display_name ?? "?")[0]}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-body text-[13px] font-bold text-white">
                    {review.users.display_name ?? "Anonymous"}
                  </span>
                  {review.users.handle && (
                    <span className="font-mono text-[11px] text-aura-muted">
                      @{review.users.handle}
                    </span>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <Star size={14} className="text-aura-orange" fill="#F97316" />
                  <span className="font-mono text-[13px] font-semibold text-white">
                    {review.score.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="mt-3 font-body text-[13px] leading-relaxed text-aura-muted2">
                {review.body}
              </p>

              <div className="mt-3 font-mono text-[10px] text-aura-muted">
                {new Date(review.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        reviews && (
          <div className="flex flex-col items-center gap-3 rounded-xl bg-[#212121] py-16">
            <p className="font-body text-[14px] font-bold text-white">
              No reviews yet
            </p>
            <p className="font-body text-xs text-aura-muted2">
              Be the first to share your thoughts on this franchise.
            </p>
          </div>
        )
      )}
    </div>
  );
}

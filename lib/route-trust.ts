import type { SupabaseClient } from "@supabase/supabase-js";

export interface TrustTier {
  /** 0 = no trust (default), 1 = auto-approve, 2 = auto-approve + relaxed limits */
  level: 0 | 1 | 2;
  approvedCount: number;
  rejectedCount: number;
  canAutoApprove: boolean;
}

/**
 * Calculate the trust tier for a route author.
 *
 * Tier 0 (default): routes go through admin review.
 * Tier 1: 3+ approved routes, 0 rejections → auto-approve on submit.
 * Tier 2: 10+ approved routes, <5% rejection rate → auto-approve + relaxed rate limit.
 *
 * This replaces the admin bottleneck for proven contributors while keeping
 * new users in the review queue where spam/quality issues are most likely.
 */
export async function getAuthorTrustTier(
  supabase: SupabaseClient,
  authorId: string,
): Promise<TrustTier> {
  const [{ count: approvedCount }, { count: rejectedCount }] =
    await Promise.all([
      supabase
        .from("route")
        .select("id", { count: "exact", head: true })
        .eq("author_id", authorId)
        .in("status", ["approved", "canon"]),
      supabase
        .from("route")
        .select("id", { count: "exact", head: true })
        .eq("author_id", authorId)
        // Routes rejected by admin go back to "draft" with a reject_reason.
        // Count rows that have a non-null reject_reason as the rejection signal.
        .not("reject_reason", "is", null),
    ]);

  const approved = approvedCount ?? 0;
  const rejected = rejectedCount ?? 0;
  const total = approved + rejected;

  // Tier 2: 10+ approved, <5% rejection rate
  if (approved >= 10 && total > 0 && rejected / total < 0.05) {
    return { level: 2, approvedCount: approved, rejectedCount: rejected, canAutoApprove: true };
  }

  // Tier 1: 3+ approved, 0 rejections
  if (approved >= 3 && rejected === 0) {
    return { level: 1, approvedCount: approved, rejectedCount: rejected, canAutoApprove: true };
  }

  // Tier 0: default
  return { level: 0, approvedCount: approved, rejectedCount: rejected, canAutoApprove: false };
}

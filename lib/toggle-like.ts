import { toast } from "sonner";

/**
 * Shared POST/DELETE like helper with auth/rate-limit handling.
 *
 * Returns:
 * - `null` if auth is needed (401) — caller should show AuthModal
 * - `{ liked: currentlyLiked, likeCount: -1 }` on error/429 — caller should revert optimistic update
 * - `{ liked, likeCount }` on success — caller should confirm with server state
 */
export async function toggleLike(
  id: string,
  itemType: "activity" | "proposal" | "franchise" | "discussion_reply",
  currentlyLiked: boolean,
): Promise<{ liked: boolean; likeCount: number } | null> {
  try {
    const res = currentlyLiked
      ? await fetch(`/api/activity/${id}/like?item_type=${itemType}`, {
          method: "DELETE",
        })
      : await fetch(`/api/activity/${id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_type: itemType }),
        });

    if (res.status === 401) return null;
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Too many requests. Slow down.");
      return { liked: currentlyLiked, likeCount: -1 };
    }
    if (!res.ok) return { liked: currentlyLiked, likeCount: -1 };
    return res.json();
  } catch {
    return { liked: currentlyLiked, likeCount: -1 };
  }
}

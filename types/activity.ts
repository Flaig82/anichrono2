/** Shaped by the /api/activity/live response (activity + joins) */
export interface LiveActivityItem {
  id: string;
  user_id: string;
  type: "complete_entry" | "start_watching" | "review" | "rate" | "drop" | "add_to_watchlist";
  created_at: string;
  metadata: Record<string, unknown>;
  user: {
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  };
  franchise: {
    title: string;
    slug: string;
  } | null;
  entry: {
    title: string;
  } | null;
}

/** Normalized item for the Updates section (proposals + new franchises) */
export interface ContentUpdateItem {
  id: string;
  kind: "proposal_applied" | "new_franchise";
  title: string;
  description: string;
  poster: string | null;
  created_at: string;
}

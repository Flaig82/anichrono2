export type FranchiseWatchStatus = "plan_to_watch" | "watching" | "completed" | "on_hold" | "dropped";
export type WatchlistStatusFilter = "all" | FranchiseWatchStatus;
export type WatchlistSort = "recent" | "title" | "progress";
export type WatchlistView = "grid" | "list";

export interface WatchlistItem {
  id: string;                    // franchise_watchlist.id
  franchise_id: string;
  status: FranchiseWatchStatus;
  added_at: string;
  updated_at: string;
  entries_completed: number;     // count of completed watch_entry rows for this franchise
  entries_total: number;         // total entry count in franchise
  progress: number;              // entries_completed / entries_total (0-1)
  franchise: {
    id: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    banner_image_url: string | null;
    genres: string[] | null;
    year_started: number | null;
    studio: string | null;
    status: string | null;
  };
}

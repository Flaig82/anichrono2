/**
 * Route = an ordered subset of a franchise's master entries, curated by a
 * community member as an opinionated watch path.
 *
 * NAMING NOTE: "route" at the code level, "Chronicle" in user-facing copy.
 * See CLAUDE.md for the full explanation.
 */

export const ROUTE_TYPES = [
  "newcomer",
  "completionist",
  "chronological",
  "manga_reader",
] as const;

export type RouteType = (typeof ROUTE_TYPES)[number];

export const ROUTE_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "canon",
] as const;

export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  newcomer: "Newcomer Route",
  completionist: "Completionist Route",
  chronological: "Chronological Route",
  manga_reader: "Manga Reader Route",
};

export const ROUTE_TYPE_SHORT: Record<RouteType, string> = {
  newcomer: "Newcomer",
  completionist: "Completionist",
  chronological: "Chronological",
  manga_reader: "Manga Reader",
};

/**
 * Colors sourced from existing Aura palette — Newcomer maps to Pioneer blue
 * (a fresh start), Completionist to Veteran green (the full run), Chronological
 * to Scholar purple (historical ordering), Manga Reader to Archivist orange.
 */
export const ROUTE_TYPE_COLORS: Record<RouteType, string> = {
  newcomer: "#3B82F6",
  completionist: "#10B981",
  chronological: "#8B5CF6",
  manga_reader: "#F97316",
};

export const ROUTE_TYPE_DESCRIPTIONS: Record<RouteType, string> = {
  newcomer: "An easier first watch — skip fillers and side content.",
  completionist: "Every episode, OVA, movie, and special in order.",
  chronological: "In-universe story order, not release order.",
  manga_reader: "Only anime-canonical entries; skips anime-original arcs.",
};

export interface RouteData {
  id: string;
  franchise_id: string;
  author_id: string;
  title: string;
  route_type: RouteType;
  entry_ids: string[];
  summary: string | null;
  status: RouteStatus;
  vote_count: number;
  follower_count: number;
  is_canon: boolean;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from users table when fetched via API */
  author?: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    era: string;
  };
  /** Whether the current user has followed this route */
  is_followed?: boolean;
  /** Current user's vote on this route, if any */
  user_vote?: -1 | 1 | null;
  /** Staleness vs master order — enriched by the franchise routes API */
  staleness?: {
    newInMaster: number;
    removedFromMaster: number;
    isStale: boolean;
    label: string;
  };
}

export interface RouteProgressData {
  id: string;
  route_id: string;
  user_id: string;
  current_position: number;
  entries_completed: string[];
  started_at: string;
  completed_at: string | null;
}

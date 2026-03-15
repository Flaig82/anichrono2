import type { EntryType } from "./franchise";

/** Shape of an entry as stored in the database and used across the app */
export interface EntryData {
  id: string;
  franchise_id: string;
  position: number;
  title: string;
  entry_type: EntryType;
  episode_start: number | null;
  episode_end: number | null;
  parent_series: string | null;
  anilist_id: number | null;
  is_essential: boolean;
  curator_note: string | null;
  cover_image_url: string | null;
}

/** Entry shape used inside the editor with local state flags */
export interface EditorEntry extends EntryData {
  _isNew?: boolean;
  _isModified?: boolean;
}

/** Row-level diff status for display */
export type DiffStatus = "added" | "removed" | "moved" | "changed" | "unchanged";

export interface DiffResult {
  entry: EntryData;
  status: DiffStatus;
  previousPosition?: number;
  changes?: string[];
}

export const PROPOSAL_STATUSES = ["open", "applied", "rejected", "withdrawn", "pending_approval"] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export interface OrderProposal {
  id: string;
  franchise_id: string;
  author_id: string;
  title: string;
  description: string | null;
  proposed_entries: EntryData[];
  status: ProposalStatus;
  vote_score: number;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
  /** Joined from users table */
  author?: {
    display_name: string;
    handle: string | null;
    avatar_url: string | null;
    era: string;
  };
  /** Current user's vote on this proposal, if any */
  user_vote?: number | null;
}

export interface ProposalVote {
  id: string;
  proposal_id: string;
  user_id: string;
  value: -1 | 1;
  created_at: string;
}

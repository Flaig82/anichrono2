import type { AuraType, Era } from "./aura";

export const QUEST_CATEGORIES = [
  "journey",
  "weekly",
  "seasonal",
  "mastery",
] as const;

export type QuestCategory = (typeof QUEST_CATEGORIES)[number];

/** Machine-readable quest condition stored as JSONB */
export type QuestCondition =
  | { type: "watch_episodes"; count: number }
  | { type: "write_review"; count: number }
  | { type: "vote_proposal"; count: number }
  | { type: "complete_anime"; count: number }
  | { type: "complete_franchise"; min_entries: number }
  | { type: "complete_pre_year"; year: number }
  | { type: "complete_obscure"; max_members: number }
  | { type: "complete_decades"; count: number }
  | { type: "submit_prediction"; count: number }
  | { type: "submit_proposal"; count: number };

export type QuestConditionType = QuestCondition["type"];

/** Quest definition (DB row) */
export interface Quest {
  id: string;
  category: QuestCategory;
  title: string;
  flavour_text: string | null;
  description: string;
  aura_type: AuraType;
  aura_amount: number;
  target: number;
  condition: QuestCondition;
  era_required: Era | null;
  is_hidden: boolean;
  sort_order: number;
  season: string | null;
  created_at: string;
}

/** Quest joined with user progress (returned from API) */
export interface QuestWithProgress {
  id: string;
  title: string;
  flavour_text: string | null;
  description: string;
  aura_type: AuraType;
  aura_amount: number;
  target: number;
  category: QuestCategory;
  is_hidden: boolean;
  era_required: Era | null;
  /** User's current progress (0 if no user_quest row) */
  progress: number;
  /** Whether the quest is completed */
  completed: boolean;
  /** Whether the quest is revealed (hidden mastery quests that haven't been triggered) */
  revealed: boolean;
}

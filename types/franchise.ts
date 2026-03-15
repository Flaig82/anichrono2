export const ENTRY_TYPES = [
  "episodes",
  "movie",
  "ova",
  "ona",
  "manga",
  "special",
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_COLORS: Record<EntryType, string> = {
  episodes: "#EEF0F6",
  movie: "#F97316",
  ova: "#3B82F6",
  ona: "#8B5CF6",
  manga: "#10B981",
  special: "#F59E0B",
};

export const OBSCURITY_TIERS = [
  "mainstream",
  "popular",
  "cult",
  "obscure",
] as const;

export type ObscurityTier = (typeof OBSCURITY_TIERS)[number];

export const OBSCURITY_MULTIPLIERS: Record<ObscurityTier, number> = {
  mainstream: 0.5,
  popular: 1.0,
  cult: 2.0,
  obscure: 4.0,
};

export const FRANCHISE_STATUSES = [
  "finished",
  "releasing",
  "not_yet_released",
] as const;

export type FranchiseStatus = (typeof FRANCHISE_STATUSES)[number];

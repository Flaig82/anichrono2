import { z } from "zod";

const FRANCHISE_WATCH_STATUSES = [
  "plan_to_watch",
  "watching",
  "completed",
  "on_hold",
  "dropped",
] as const;

export const addToWatchlistSchema = z.object({
  franchise_id: z.string().uuid(),
  status: z.enum(FRANCHISE_WATCH_STATUSES).default("plan_to_watch"),
});

export const updateWatchlistSchema = z.object({
  franchise_id: z.string().uuid(),
  status: z.enum(FRANCHISE_WATCH_STATUSES),
});

export const removeFromWatchlistSchema = z.object({
  franchise_id: z.string().uuid(),
});

export const watchlistActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), franchise_id: z.string().uuid(), status: z.enum(FRANCHISE_WATCH_STATUSES).default("plan_to_watch") }),
  z.object({ action: z.literal("update"), franchise_id: z.string().uuid(), status: z.enum(FRANCHISE_WATCH_STATUSES) }),
  z.object({ action: z.literal("remove"), franchise_id: z.string().uuid() }),
]);

export type WatchlistActionInput = z.infer<typeof watchlistActionSchema>;

export const watchlistQuerySchema = z.object({
  status: z.enum(["all", ...FRANCHISE_WATCH_STATUSES]).default("all"),
  sort: z.enum(["recent", "title", "progress"]).default("recent"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export type WatchlistQueryInput = z.infer<typeof watchlistQuerySchema>;

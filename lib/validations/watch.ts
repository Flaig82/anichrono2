import { z } from "zod";

export const WATCH_ACTIONS = [
  "increment",
  "decrement",
  "complete",
  "reset",
  "set",
] as const;

export type WatchAction = (typeof WATCH_ACTIONS)[number];

export const updateWatchSchema = z.object({
  entry_id: z.string().uuid(),
  franchise_id: z.string().uuid(),
  action: z.enum(WATCH_ACTIONS),
  value: z.number().int().min(0).optional(),
});

export type UpdateWatchInput = z.infer<typeof updateWatchSchema>;

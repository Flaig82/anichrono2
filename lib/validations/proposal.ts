import { z } from "zod";
import { ENTRY_TYPES } from "@/types/franchise";

const entrySchema = z.object({
  id: z.string().uuid(),
  franchise_id: z.string().uuid(),
  position: z.number().int().min(1),
  title: z.string().min(1).max(200),
  entry_type: z.enum(ENTRY_TYPES),
  episode_start: z.number().int().nullable(),
  episode_end: z.number().int().nullable(),
  parent_series: z.string().nullable(),
  anilist_id: z.number().int().nullable(),
  is_essential: z.boolean(),
  curator_note: z.string().max(500).nullable(),
  cover_image_url: z.string().url().nullable(),
});

export const createProposalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(1000).nullable().optional(),
  proposed_entries: z.array(entrySchema).min(1, "At least one entry required"),
});

export const voteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(1)]),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type VoteInput = z.infer<typeof voteSchema>;

import { z } from "zod";
import { ENTRY_TYPES, FRANCHISE_STATUSES } from "@/types/franchise";

const createEntrySchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().min(1),
  title: z.string().min(1).max(200),
  entry_type: z.enum(ENTRY_TYPES),
  episode_start: z.number().int().nullable(),
  episode_end: z.number().int().nullable(),
  parent_series: z.string().nullable(),
  anilist_id: z.number().int().nullable(),
  is_essential: z.boolean(),
  curator_note: z.string().max(500).nullable(),
  cover_image_url: z.string().url().nullable().or(z.literal("")),
});

export const createFranchiseSchema = z.object({
  anilist_id: z.number().int(),
  title: z.string().min(1).max(200),
  description: z.string().nullable(),
  genres: z.array(z.string()),
  year_started: z.number().int().nullable(),
  studio: z.string().nullable(),
  status: z.enum(FRANCHISE_STATUSES),
  cover_image_url: z.string().url().nullable(),
  banner_image_url: z.string().url().nullable(),
  entries: z.array(createEntrySchema).min(1, "At least one entry required"),
});

export type CreateFranchiseInput = z.infer<typeof createFranchiseSchema>;

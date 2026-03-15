import { z } from "zod";

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less")
    .optional(),
  handle: z
    .string()
    .min(3, "Handle must be at least 3 characters")
    .max(20, "Handle must be 20 characters or less")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Handle can only contain letters, numbers, hyphens, and underscores",
    )
    .optional(),
  bio: z.string().max(300, "Bio must be 300 characters or less").optional(),
  anilist_username: z
    .string()
    .max(50)
    .nullable()
    .optional(),
  mal_username: z
    .string()
    .max(50)
    .nullable()
    .optional(),
  is_watchlist_public: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

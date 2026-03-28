import { z } from "zod";

export const importAniListSchema = z.object({
  dry_run: z.boolean().optional(),
});

export type ImportAniListInput = z.infer<typeof importAniListSchema>;

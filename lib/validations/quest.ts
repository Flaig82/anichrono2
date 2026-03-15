import { z } from "zod";

export const questProgressSchema = z.object({
  quest_id: z.string().uuid("Invalid quest ID"),
});

export type QuestProgressInput = z.infer<typeof questProgressSchema>;

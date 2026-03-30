import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "like",
  "quest_complete",
  "era_promotion",
  "discussion_reply",
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const markReadSchema = z.object({
  notification_id: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;

import { z } from "zod";

export const activityLikeSchema = z.object({
  item_type: z.enum(["activity", "proposal", "franchise", "discussion_reply"]),
});

export type ActivityLikeInput = z.infer<typeof activityLikeSchema>;

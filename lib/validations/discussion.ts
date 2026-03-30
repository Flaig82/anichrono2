import { z } from "zod";

export const createDiscussionSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be at most 200 characters"),
  body: z
    .string()
    .min(10, "Body must be at least 10 characters")
    .max(5000, "Body must be at most 5,000 characters"),
});

export type CreateDiscussionInput = z.infer<typeof createDiscussionSchema>;

export const createReplySchema = z.object({
  body: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(3000, "Reply must be at most 3,000 characters"),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;

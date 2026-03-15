import { z } from "zod";

export const createReviewSchema = z.object({
  franchise_id: z.string().uuid(),
  body: z
    .string()
    .min(50, "Review must be at least 50 characters")
    .max(5000, "Review must be under 5000 characters"),
  score: z
    .number()
    .min(1, "Score must be at least 1")
    .max(10, "Score must be at most 10")
    .multipleOf(0.5, "Score must be in 0.5 increments"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

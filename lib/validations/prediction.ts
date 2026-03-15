import { z } from "zod";

export const matchupVoteSchema = z.object({
  vote: z.enum(["a", "b"]),
});

export type MatchupVoteInput = z.infer<typeof matchupVoteSchema>;

export const awardVoteSchema = z.object({
  nominee_id: z.string().uuid(),
});

export type AwardVoteInput = z.infer<typeof awardVoteSchema>;

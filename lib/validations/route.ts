import { z } from "zod";
import { ROUTE_TYPES } from "@/types/route";

export const createRouteSchema = z.object({
  franchise_id: z.string().uuid(),
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be 100 characters or less"),
  route_type: z.enum(ROUTE_TYPES),
  entry_ids: z
    .array(z.string().uuid())
    .min(1, "At least one entry required")
    .max(500, "Too many entries"),
  summary: z
    .string()
    .trim()
    .max(300, "Summary must be 300 characters or less")
    .nullable()
    .optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;

export const routeVoteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(1)]),
});

export type RouteVoteInput = z.infer<typeof routeVoteSchema>;

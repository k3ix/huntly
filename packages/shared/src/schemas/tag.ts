import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

export const tagResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type CreateTag = z.infer<typeof createTagSchema>;
export type TagResponse = z.infer<typeof tagResponseSchema>;

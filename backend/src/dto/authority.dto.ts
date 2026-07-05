import { z } from "zod";

export const createAuthoritySchema = z.object({
  name: z.string().min(2).max(200),
  code: z.string().min(2).max(20).toUpperCase(),
  country: z.string().min(2).max(100),
  websiteUrl: z.string().url().optional(),
});

export type CreateAuthorityInput = z.infer<typeof createAuthoritySchema>;

import { z } from "zod";

// Deliberately loose here - rawStatus/severity are free text on input because that's exactly what an external feed would hand us. The normalization service decides afterward whether it's usable.
export const createDirectiveSchema = z.object({
  authorityId: z.string().uuid(),
  referenceCode: z.string().min(1).max(50),
  title: z.string().min(3).max(300),
  summary: z.string().max(2000).optional(),
  rawStatus: z.string().max(50),
  severity: z.string().max(50),
  publishedDate: z.coerce.date().optional(),
  effectiveDate: z.coerce.date().optional(),
});

export type CreateDirectiveInput = z.infer<typeof createDirectiveSchema>;

export const listDirectivesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().trim().max(200).optional(),
  authorityId: z.string().uuid().optional(),
  status: z.string().max(50).optional(),
  severity: z.string().max(50).optional(),
  corruptOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ListDirectivesQuery = z.infer<typeof listDirectivesQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

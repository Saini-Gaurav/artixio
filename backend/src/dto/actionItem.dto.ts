import { z } from "zod";

export const actionItemStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "BLOCKED"]);

export const createActionItemSchema = z.object({
  directiveId: z.string().uuid(),
  title: z.string().min(3).max(300),
  description: z.string().max(2000).optional(),
  assignee: z.string().max(150).optional(),
  priority: z.string().max(50),
  dueDate: z.coerce.date().optional(),
});

export type CreateActionItemInput = z.infer<typeof createActionItemSchema>;

export const updateActionItemStatusSchema = z.object({
  status: actionItemStatusEnum,
});

export type UpdateActionItemStatusInput = z.infer<typeof updateActionItemStatusSchema>;

export const listActionItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  status: actionItemStatusEnum.optional(),
  directiveId: z.string().uuid().optional(),
  flaggedOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ListActionItemsQuery = z.infer<typeof listActionItemsQuerySchema>;

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

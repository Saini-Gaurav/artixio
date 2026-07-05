import { ActionItemStatus } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { actionItemRepository } from "../repositories/actionItem.repository";
import { directiveRepository } from "../repositories/directive.repository";
import { CreateActionItemInput, ListActionItemsQuery } from "../dto/actionItem.dto";
import { normalizePriority } from "../utils/normalizeRegulatoryData";

// Status transitions we consider valid. BLOCKED can move back to IN_PROGRESS, but nothing moves out of RESOLVED without an explicit reopen flow, which is out of scope here on purpose.
const ALLOWED_TRANSITIONS: Record<ActionItemStatus, ActionItemStatus[]> = {
  PENDING: ["IN_PROGRESS", "BLOCKED"],
  IN_PROGRESS: ["RESOLVED", "BLOCKED", "PENDING"],
  BLOCKED: ["IN_PROGRESS", "PENDING"],
  RESOLVED: [],
};

export const actionItemService = {
  async list(query: ListActionItemsQuery) {
    const { rows, total } = await actionItemRepository.findMany(query);
    return {
      rows,
      meta: { page: query.page, limit: query.limit, total },
    };
  },

  async getById(id: string) {
    const item = await actionItemRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Action item ${id} not found`);
    }
    return item;
  },

  async create(input: CreateActionItemInput) {
    const directive = await directiveRepository.findById(input.directiveId);
    if (!directive) {
      throw ApiError.badRequest(`Directive ${input.directiveId} does not exist`);
    }

    const { isFlagged, flagReason } = normalizePriority(input.priority);

    return actionItemRepository.create({
      ...input,
      isFlagged,
      flagReason,
    });
  },

  async updateStatus(id: string, nextStatus: ActionItemStatus) {
    const item = await actionItemRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Action item ${id} not found`);
    }

    if (item.status === nextStatus) {
      return item;
    }

    const allowed = ALLOWED_TRANSITIONS[item.status];
    if (!allowed.includes(nextStatus)) {
      throw ApiError.conflict(
        `Cannot move action item from ${item.status} to ${nextStatus}`,
        { allowedNext: allowed }
      );
    }

    return actionItemRepository.updateStatusWithAudit(id, item.status, nextStatus);
  },

  async remove(id: string) {
    const item = await actionItemRepository.findById(id);
    if (!item) {
      throw ApiError.notFound(`Action item ${id} not found`);
    }
    return actionItemRepository.softDelete(id);
  },

  async restore(id: string) {
    const item = await actionItemRepository.findByIdIncludingDeleted(id);
    if (!item) {
      throw ApiError.notFound(`Action item ${id} not found`);
    }
    if (!item.deletedAt) {
      return item;
    }
    return actionItemRepository.restore(id);
  },
};

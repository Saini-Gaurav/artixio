import { ActionItemStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ListActionItemsQuery } from "../dto/actionItem.dto";

interface CreateActionItemData {
  directiveId: string;
  title: string;
  description?: string;
  assignee?: string;
  priority: string;
  dueDate?: Date;
  isFlagged: boolean;
  flagReason: string | null;
}

export const actionItemRepository = {
  async findMany(query: ListActionItemsQuery) {
    const where: Prisma.ActionItemWhereInput = {
      deletedAt: null,
      ...(query.directiveId ? { directiveId: query.directiveId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.flaggedOnly !== undefined ? { isFlagged: query.flaggedOnly } : {}),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.actionItem.findMany({
        where,
        include: { directive: { select: { title: true, referenceCode: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.actionItem.count({ where }),
    ]);

    return { rows, total };
  },

  findById(id: string) {
    return prisma.actionItem.findFirst({ where: { id, deletedAt: null } });
  },

  // Used by restore() to check a record exists at all, including ones
  // already soft-deleted.
  findByIdIncludingDeleted(id: string) {
    return prisma.actionItem.findUnique({ where: { id } });
  },

  create(data: CreateActionItemData) {
    return prisma.actionItem.create({ data });
  },

  updateStatus(id: string, status: ActionItemStatus) {
    return prisma.actionItem.update({ where: { id }, data: { status } });
  },

  // Status change and its audit log entry land in the same transaction so
  // the two can never drift apart.
  updateStatusWithAudit(id: string, previousStatus: ActionItemStatus, newStatus: ActionItemStatus) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.actionItem.update({ where: { id }, data: { status: newStatus } });
      await tx.auditLog.create({
        data: { actionItemId: id, previousStatus, newStatus },
      });
      return updated;
    });
  },

  softDelete(id: string) {
    return prisma.actionItem.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  restore(id: string) {
    return prisma.actionItem.update({ where: { id }, data: { deletedAt: null } });
  },
};

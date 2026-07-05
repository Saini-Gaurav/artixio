import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ListDirectivesQuery } from "../dto/directive.dto";

interface CreateDirectiveData {
  authorityId: string;
  referenceCode: string;
  title: string;
  summary?: string;
  rawStatus: string;
  severity: string;
  publishedDate?: Date;
  effectiveDate?: Date;
  isCorrupt: boolean;
  corruptReason: string | null;
}

export const directiveRepository = {
  async findMany(query: ListDirectivesQuery) {
    const where: Prisma.ComplianceDirectiveWhereInput = {
      deletedAt: null,
      ...(query.authorityId ? { authorityId: query.authorityId } : {}),
      ...(query.status ? { rawStatus: { equals: query.status, mode: "insensitive" } } : {}),
      ...(query.severity ? { severity: { equals: query.severity, mode: "insensitive" } } : {}),
      ...(query.corruptOnly !== undefined ? { isCorrupt: query.corruptOnly } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { referenceCode: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.complianceDirective.findMany({
        where,
        include: { authority: true, _count: { select: { actionItems: true } } },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.complianceDirective.count({ where }),
    ]);

    return { rows, total };
  },

  // findUnique can't combine a unique-field lookup with an extra deletedAt
  // condition, so this uses findFirst instead.
  findById(id: string) {
    return prisma.complianceDirective.findFirst({
      where: { id, deletedAt: null },
      include: { authority: true, actionItems: { where: { deletedAt: null } } },
    });
  },

  // Used by restore() to check a record exists at all, including ones
  // already soft-deleted.
  findByIdIncludingDeleted(id: string) {
    return prisma.complianceDirective.findUnique({ where: { id } });
  },

  create(data: CreateDirectiveData) {
    return prisma.complianceDirective.create({ data });
  },

  softDelete(id: string) {
    return prisma.complianceDirective.update({ where: { id }, data: { deletedAt: new Date() } });
  },

  restore(id: string) {
    return prisma.complianceDirective.update({ where: { id }, data: { deletedAt: null } });
  },
};

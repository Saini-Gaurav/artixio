import { prisma } from "../config/db";
import { CreateAuthorityInput } from "../dto/authority.dto";

export const authorityRepository = {
  findAll() {
    return prisma.regulatoryAuthority.findMany({ orderBy: { name: "asc" } });
  },

  findById(id: string) {
    return prisma.regulatoryAuthority.findUnique({ where: { id } });
  },

  findByCode(code: string) {
    return prisma.regulatoryAuthority.findUnique({ where: { code } });
  },

  create(data: CreateAuthorityInput) {
    return prisma.regulatoryAuthority.create({ data });
  },
};

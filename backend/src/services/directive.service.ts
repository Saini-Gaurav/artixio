import { ApiError } from "../utils/ApiError";
import { directiveRepository } from "../repositories/directive.repository";
import { authorityRepository } from "../repositories/authority.repository";
import { CreateDirectiveInput, ListDirectivesQuery } from "../dto/directive.dto";
import { normalizeDirective } from "../utils/normalizeRegulatoryData";

export const directiveService = {
  async list(query: ListDirectivesQuery) {
    const { rows, total } = await directiveRepository.findMany(query);
    return {
      rows,
      meta: { page: query.page, limit: query.limit, total },
    };
  },

  async getById(id: string) {
    const directive = await directiveRepository.findById(id);
    if (!directive) {
      throw ApiError.notFound(`Directive ${id} not found`);
    }
    return directive;
  },

  async create(input: CreateDirectiveInput) {
    const authority = await authorityRepository.findById(input.authorityId);
    if (!authority) {
      throw ApiError.badRequest(`Authority ${input.authorityId} does not exist`);
    }

    const { isCorrupt, corruptReason } = normalizeDirective({
      rawStatus: input.rawStatus,
      severity: input.severity,
      publishedDate: input.publishedDate ?? null,
      effectiveDate: input.effectiveDate ?? null,
    });

    return directiveRepository.create({
      ...input,
      isCorrupt,
      corruptReason,
    });
  },

  async remove(id: string) {
    const directive = await directiveRepository.findById(id);
    if (!directive) {
      throw ApiError.notFound(`Directive ${id} not found`);
    }
    return directiveRepository.softDelete(id);
  },

  async restore(id: string) {
    const directive = await directiveRepository.findByIdIncludingDeleted(id);
    if (!directive) {
      throw ApiError.notFound(`Directive ${id} not found`);
    }
    if (!directive.deletedAt) {
      return directive;
    }
    return directiveRepository.restore(id);
  },
};

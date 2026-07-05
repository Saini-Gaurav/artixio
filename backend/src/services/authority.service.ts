import { ApiError } from "../utils/ApiError";
import { authorityRepository } from "../repositories/authority.repository";
import { CreateAuthorityInput } from "../dto/authority.dto";

export const authorityService = {
  listAll() {
    return authorityRepository.findAll();
  },

  async getById(id: string) {
    const authority = await authorityRepository.findById(id);
    if (!authority) {
      throw ApiError.notFound(`Authority ${id} not found`);
    }
    return authority;
  },

  async create(input: CreateAuthorityInput) {
    const existing = await authorityRepository.findByCode(input.code);
    if (existing) {
      throw ApiError.conflict(`Authority code "${input.code}" is already in use`);
    }
    return authorityRepository.create(input);
  },
};

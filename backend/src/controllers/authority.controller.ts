import { Request, Response } from "express";
import { authorityService } from "../services/authority.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const authorityController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const authorities = await authorityService.listAll();
    sendSuccess(res, authorities);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const authority = await authorityService.getById(req.params.id);
    sendSuccess(res, authority);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const authority = await authorityService.create(req.body);
    sendSuccess(res, authority, 201);
  }),
};

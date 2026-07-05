import { Request, Response } from "express";
import { directiveService } from "../services/directive.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ListDirectivesQuery } from "../dto/directive.dto";

export const directiveController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListDirectivesQuery;
    const { rows, meta } = await directiveService.list(query);
    sendSuccess(res, rows, 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const directive = await directiveService.getById(req.params.id);
    sendSuccess(res, directive);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const directive = await directiveService.create(req.body);
    sendSuccess(res, directive, 201);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await directiveService.remove(req.params.id);
    res.status(204).send();
  }),

  restore: asyncHandler(async (req: Request, res: Response) => {
    const directive = await directiveService.restore(req.params.id);
    sendSuccess(res, directive);
  }),
};

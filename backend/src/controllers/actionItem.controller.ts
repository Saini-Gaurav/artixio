import { Request, Response } from "express";
import { actionItemService } from "../services/actionItem.service";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { ListActionItemsQuery } from "../dto/actionItem.dto";

export const actionItemController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListActionItemsQuery;
    const { rows, meta } = await actionItemService.list(query);
    sendSuccess(res, rows, 200, meta);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await actionItemService.getById(req.params.id);
    sendSuccess(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await actionItemService.create(req.body);
    sendSuccess(res, item, 201);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const item = await actionItemService.updateStatus(req.params.id, req.body.status);
    sendSuccess(res, item);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await actionItemService.remove(req.params.id);
    res.status(204).send();
  }),

  restore: asyncHandler(async (req: Request, res: Response) => {
    const item = await actionItemService.restore(req.params.id);
    sendSuccess(res, item);
  }),
};

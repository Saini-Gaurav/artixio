import { Router } from "express";
import { actionItemController } from "../controllers/actionItem.controller";
import { validate } from "../middleware/validate";
import {
  createActionItemSchema,
  idParamSchema,
  listActionItemsQuerySchema,
  updateActionItemStatusSchema,
} from "../dto/actionItem.dto";
import { writeRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", validate({ query: listActionItemsQuerySchema }), actionItemController.list);
router.get("/:id", validate({ params: idParamSchema }), actionItemController.getById);
router.post("/", writeRateLimiter, validate({ body: createActionItemSchema }), actionItemController.create);
router.patch(
  "/:id/status",
  writeRateLimiter,
  validate({ params: idParamSchema, body: updateActionItemStatusSchema }),
  actionItemController.updateStatus
);
router.delete("/:id", writeRateLimiter, validate({ params: idParamSchema }), actionItemController.remove);
router.post("/:id/restore", writeRateLimiter, validate({ params: idParamSchema }), actionItemController.restore);

export default router;

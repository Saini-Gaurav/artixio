import { Router } from "express";
import { directiveController } from "../controllers/directive.controller";
import { validate } from "../middleware/validate";
import { createDirectiveSchema, idParamSchema, listDirectivesQuerySchema } from "../dto/directive.dto";
import { writeRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", validate({ query: listDirectivesQuerySchema }), directiveController.list);
router.get("/:id", validate({ params: idParamSchema }), directiveController.getById);
router.post("/", writeRateLimiter, validate({ body: createDirectiveSchema }), directiveController.create);
router.delete("/:id", writeRateLimiter, validate({ params: idParamSchema }), directiveController.remove);
router.post("/:id/restore", writeRateLimiter, validate({ params: idParamSchema }), directiveController.restore);

export default router;

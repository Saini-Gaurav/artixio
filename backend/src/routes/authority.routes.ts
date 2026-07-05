import { Router } from "express";
import { authorityController } from "../controllers/authority.controller";
import { validate } from "../middleware/validate";
import { createAuthoritySchema } from "../dto/authority.dto";
import { writeRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", authorityController.list);
router.get("/:id", authorityController.getById);
router.post("/", writeRateLimiter, validate({ body: createAuthoritySchema }), authorityController.create);

export default router;

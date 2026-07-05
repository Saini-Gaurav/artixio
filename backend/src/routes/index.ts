import { Router } from "express";
import authorityRoutes from "./authority.routes";
import directiveRoutes from "./directive.routes";
import actionItemRoutes from "./actionItem.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "ok", timestamp: new Date().toISOString() });
});

router.use("/authorities", authorityRoutes);
router.use("/directives", directiveRoutes);
router.use("/action-items", actionItemRoutes);

export default router;

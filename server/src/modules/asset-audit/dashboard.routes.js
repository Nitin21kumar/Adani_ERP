import { Router } from "express";
import { auditProtect } from "./audit.middleware.js";
import * as controller from "./dashboard.controller.js";

const router = Router();
router.get("/summary", auditProtect, controller.summary);
export default router;

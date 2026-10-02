import { Router } from "express";
import auditAuthRoutes from "./audit-auth.routes.js";
import auditUserRoutes from "./audit-user.routes.js";
import productRoutes from "./product.routes.js";
import damageCriteriaRoutes from "./damage-criteria.routes.js";
import conditionRatingRoutes from "./condition-rating.routes.js";
import auditTaskRoutes from "./audit-task.routes.js";
import verificationRoutes from "./verification.routes.js";
import misRoutes from "./mis.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import auditNotificationRoutes from "./audit-notification.routes.js";

// Self-contained sub-router for the whole Asset Audit & Verification Portal.
// Mounted once, at /audit, in routes/index.js — every other Employee ERP
// route is untouched. Nothing here imports the employee auth/user modules.
const router = Router();
router.use("/auth", auditAuthRoutes);
router.use("/users", auditUserRoutes);
router.use("/products", productRoutes);
router.use("/damage-criteria", damageCriteriaRoutes);
router.use("/condition-ratings", conditionRatingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/mis", misRoutes);
router.use("/notifications", auditNotificationRoutes);
router.use(auditTaskRoutes);
router.use(verificationRoutes);
export default router;

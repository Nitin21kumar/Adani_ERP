import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import roleRoutes from "../modules/auth/role.routes.js";
import employeeRoutes from "../modules/employees/employee.routes.js";
import departmentRoutes from "../modules/departments/department.routes.js";
import attendanceRoutes from "../modules/attendance/attendance.routes.js";
import leaveRoutes from "../modules/leave/leave.routes.js";
import wfhRoutes from "../modules/work-from-home/wfh.routes.js";
import dailyReportRoutes from "../modules/daily-reports/daily-report.routes.js";
import notificationRoutes from "../modules/notifications/notification.routes.js";
import profileRoutes from "../modules/profile/profile.routes.js";
import settingsRoutes from "../modules/settings/settings.routes.js";
import reportRoutes from "../modules/reports/report.routes.js";
import uploadRoutes from "../modules/uploads/upload.routes.js";
import auditRoutes from "../modules/asset-audit/audit.routes.js";
const router = Router();
router.use("/auth", authRoutes); router.use("/roles", roleRoutes); router.use("/employees", employeeRoutes); router.use("/departments", departmentRoutes); router.use("/attendance", attendanceRoutes); router.use("/leave", leaveRoutes); router.use("/wfh", wfhRoutes); router.use("/daily-reports", dailyReportRoutes); router.use("/notifications", notificationRoutes); router.use("/profile", profileRoutes); router.use("/settings", settingsRoutes); router.use("/reports", reportRoutes); router.use("/uploads", uploadRoutes);
// Asset Audit & Verification Portal — fully separate module (own models,
// auth, and roles). See server/src/modules/asset-audit/.
router.use("/audit", auditRoutes);
export default router;

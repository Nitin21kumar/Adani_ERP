import { Router } from "express";
import { allow, managementRoles, protect } from "../../core/middleware/auth.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./attendance.controller.js";
const router = Router(); router.use(protect); router.post("/login", requireFields("latitude", "longitude"), controller.login); router.post("/logout", requireFields("latitude", "longitude"), controller.logout); router.get("/me/today", controller.myToday); router.get("/me/history", controller.myHistory); router.get("/", allow(...managementRoles, "manager"), controller.list); export default router;

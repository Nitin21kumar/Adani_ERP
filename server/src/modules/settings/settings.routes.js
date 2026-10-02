import { Router } from "express";
import { allow, managementRoles, protect } from "../../core/middleware/auth.js";
import { requireFields } from "../../core/middleware/validate.js";
import * as controller from "./settings.controller.js";
const router = Router(); router.get("/public", controller.publicSettings); router.use(protect); router.get("/company", allow(...managementRoles), controller.getCompany); router.put("/company", allow(...managementRoles), controller.updateCompany); router.get("/holidays", controller.listHolidays); router.post("/holidays", allow(...managementRoles), requireFields("name", "date"), controller.createHoliday); router.delete("/holidays/:id", allow(...managementRoles), controller.deleteHoliday); export default router;

import { Router } from "express";
import {
  getDashboardStats,
  generateReport,
  exportReport
} from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";
import { parseAntigravityFilters } from "../middlewares/antigravity.middleware.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];
const teacherOnly = [verifyJWT, hasRole(["teacher"])];
const studentOnly = [verifyJWT, hasRole(["student"])];
const adminOrTeacher = [verifyJWT, hasRole(["admin", "teacher"])];

router.get("/dashboard", ...adminOnly, getDashboardStats);

// V2 Universal Endpoints
router.post("/generate", verifyJWT, parseAntigravityFilters, generateReport);
router.post("/export", verifyJWT, parseAntigravityFilters, exportReport);

export default router;

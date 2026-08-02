import { Router } from "express";
import {
  getDashboardStats,
  getDefaulters,
  exportAdminReport,
  exportTeacherReport,
  exportStudentTranscript,
  getComprehensiveReport
} from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];
const teacherOnly = [verifyJWT, hasRole(["teacher"])];
const studentOnly = [verifyJWT, hasRole(["student"])];
const adminOrTeacher = [verifyJWT, hasRole(["admin", "teacher"])];

router.get("/dashboard", ...adminOnly, getDashboardStats);
router.get("/defaulters", ...adminOnly, getDefaulters);
router.get("/comprehensive", ...adminOrTeacher, getComprehensiveReport);

router.get("/export/admin", ...adminOnly, exportAdminReport);
router.get("/export/teacher", ...teacherOnly, exportTeacherReport);
router.get("/export/student", ...studentOnly, exportStudentTranscript);

export default router;

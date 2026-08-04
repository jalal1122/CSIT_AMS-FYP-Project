import { Router } from "express";
import {
  startSession,
  endSession,
  generateQRToken,
  getActiveSession,
  getSessionById,
  getLiveAttendance,
  updateSessionSecurity,
  createRetroactiveSession,
  getActiveSessionsForAdmin,
} from "../controllers/session.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";

const router = Router();
const teacherOnly = [verifyJWT, hasRole(["teacher", "admin"])];
const adminOnly = [verifyJWT, hasRole(["admin"])];

router.get("/active-all", ...adminOnly, getActiveSessionsForAdmin);
router.get("/active", ...teacherOnly, getActiveSession);
router.post("/start", ...teacherOnly, startSession);
router.post("/retroactive", ...teacherOnly, createRetroactiveSession);
router.get("/:id", ...teacherOnly, getSessionById);
router.post("/:id/end", ...teacherOnly, endSession);
router.put("/:id/security", ...teacherOnly, updateSessionSecurity);
router.get("/:id/qr", ...teacherOnly, generateQRToken);
router.get("/:id/live", ...teacherOnly, getLiveAttendance);
router.get("/:id/live", ...teacherOnly, getLiveAttendance);

export default router;

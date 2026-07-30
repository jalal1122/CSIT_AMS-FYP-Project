import { Router } from "express";
import {
  startSession,
  endSession,
  generateQRToken,
  getActiveSession,
  getLiveAttendance,
} from "../controllers/session.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";

const router = Router();
const teacherOnly = [verifyJWT, hasRole(["teacher"])];

router.post("/start", ...teacherOnly, startSession);
router.post("/:id/end", ...teacherOnly, endSession);
router.get("/:id/qr", ...teacherOnly, generateQRToken);
router.get("/active", ...teacherOnly, getActiveSession);
router.get("/:id/live", ...teacherOnly, getLiveAttendance);

export default router;

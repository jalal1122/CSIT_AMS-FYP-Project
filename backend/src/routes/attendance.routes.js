import { Router } from "express";
import {
  markAttendance,
  updateAttendance,
} from "../controllers/attendance.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";

const router = Router();

// Student routes
router.post("/mark", verifyJWT, hasRole(["student"]), markAttendance);

// Teacher routes
router.put("/:id", verifyJWT, hasRole(["teacher", "admin"]), updateAttendance);

export default router;

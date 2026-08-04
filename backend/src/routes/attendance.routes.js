import { Router } from "express";
import {
  markAttendance,
  updateAttendance,
  insertBulkAttendance,
} from "../controllers/attendance.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";

const router = Router();

router.use(verifyJWT);

// Student
router.post("/mark", hasRole(["student"]), markAttendance);

// Teacher
router.put("/:id", hasRole(["teacher", "admin"]), updateAttendance);
router.post("/bulk", hasRole(["teacher", "admin"]), insertBulkAttendance);

export default router;

import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";
import { uploadExcel } from "../middlewares/upload.middleware.js";
import * as academic from "../controllers/academic.controller.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];
const teacherOnly = [verifyJWT, hasRole(["teacher", "admin"])];
const studentOnly = [verifyJWT, hasRole(["student"])];

router.post("/batch/create", ...adminOnly, uploadExcel, academic.createBatch);
router.get("/batches", ...adminOnly, academic.getBatches);
router.get("/batch/:id", ...adminOnly, academic.getBatch);
router.get("/batch/:id/sections", ...adminOnly, academic.getBatchSections);
router.post("/batch/:id/promote", ...adminOnly, academic.promoteBatch);
router.post("/batch/:id/rollback", ...adminOnly, academic.rollbackPromotion);

router.post("/allocation/assign", ...adminOnly, academic.allocateCourse);
router.get("/allocations", verifyJWT, hasRole(["admin", "teacher"]), academic.getAllocations);

router.post("/student/:id/transfer", ...adminOnly, academic.transferStudent);

// Teacher Dashboard
router.get("/teacher/dashboard", ...teacherOnly, academic.getTeacherDashboard);
router.get("/teacher/history", ...teacherOnly, academic.getTeacherHistory);
router.get("/teacher/class/:allocationId/:sectionName", ...teacherOnly, academic.getClassDetails);
router.get("/teacher/class/:allocationId/:sectionName/sessions", ...teacherOnly, academic.getClassSessions);
router.get("/teacher/class/:allocationId/:sectionName/student/:studentId/report", ...teacherOnly, academic.getStudentClassReport);

// Student Dashboard
router.get("/student/dashboard", ...studentOnly, academic.getStudentDashboard);
router.get("/student/history", ...studentOnly, academic.getStudentHistory);
router.get("/student/class/:allocationId/attendance", ...studentOnly, academic.getStudentAttendanceForClass);

export default router;

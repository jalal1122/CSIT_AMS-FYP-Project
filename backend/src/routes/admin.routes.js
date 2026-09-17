import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";
// import { preventOrphans } from "../middlewares/preventOrphans.middleware.js"; // department is in system
import * as admin from "../controllers/admin.controller.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];

router.post("/users", ...adminOnly, admin.createUser);
router.put("/users/:id", ...adminOnly, admin.updateUser);
router.patch("/users/:id/reset-device", ...adminOnly, admin.resetDevice);
router.patch("/users/:id/reset-password", ...adminOnly, admin.resetPassword);
router.put("/users/:id/transfer", ...adminOnly, admin.transferStudent);
router.get("/users", ...adminOnly, admin.getUsers);
router.patch("/users/:id/status", ...adminOnly, admin.updateUserStatus); 

router.post("/teacher/:id/offboard", ...adminOnly, admin.offboardTeacher);
router.patch("/allocation/:id/reassign-teacher", ...adminOnly, admin.reassignTeacher);
router.patch("/allocation/:id/retroactive", ...adminOnly, admin.toggleRetroactivePermission);

router.put("/subject/:id/archive", ...adminOnly, admin.archiveSubject);

// User lockout management
router.post("/users/:id/unlock", ...adminOnly, admin.unlockUserAccount);

// Bulk sync student enrollments to active CourseAllocation sections
router.post("/sync-enrollment", ...adminOnly, admin.syncEnrollment);

export default router;

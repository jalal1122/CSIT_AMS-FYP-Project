import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";
// import { preventOrphans } from "../middlewares/preventOrphans.middleware.js"; // department is in system
import * as admin from "../controllers/admin.controller.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];

router.patch("/users/:id/reset-device", ...adminOnly, admin.resetDevice);
router.patch("/users/:id/reset-password", ...adminOnly, admin.resetPassword);
router.put("/users/:id/transfer", ...adminOnly, admin.transferStudent);
router.get("/users", ...adminOnly, admin.getUsers);
// router.patch("/users/:id/status", ...adminOnly, admin.updateUserStatus); // We didn't explicitly implement updateUserStatus yet, it can be added later

router.post("/teacher/:id/offboard", ...adminOnly, admin.offboardTeacher);
router.patch("/allocation/:id/reassign-teacher", ...adminOnly, admin.reassignTeacher);

router.put("/subject/:id/archive", ...adminOnly, admin.archiveSubject);

export default router;

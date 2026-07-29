import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";
import { uploadExcel } from "../middlewares/upload.middleware.js";
import * as academic from "../controllers/academic.controller.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];

router.post("/batch/create", ...adminOnly, uploadExcel, academic.createBatch);
router.get("/batches", ...adminOnly, academic.getBatches);
router.get("/batch/:id", ...adminOnly, academic.getBatch);
router.post("/batch/:id/promote", ...adminOnly, academic.promoteBatch);
router.post("/batch/:id/rollback", ...adminOnly, academic.rollbackPromotion);

router.post("/allocation/assign", ...adminOnly, academic.allocateCourse);
router.get("/allocations", verifyJWT, hasRole(["admin", "teacher"]), academic.getAllocations);
// router.get("/allocation/:id", verifyJWT, academic.getAllocationById); // Not implemented yet, leave commented out

export default router;

import { Router } from "express";
import {
  getDashboardStats,
  getDefaulters,
} from "../controllers/analytics.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";

const router = Router();
const adminOnly = [verifyJWT, hasRole(["admin"])];

router.get("/dashboard", ...adminOnly, getDashboardStats);
router.get("/defaulters", ...adminOnly, getDefaulters);

export default router;

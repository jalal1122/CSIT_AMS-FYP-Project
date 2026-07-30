import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { hasRole } from "../middlewares/role.middleware.js";
import * as settings from "../controllers/systemSettings.controller.js";

const router = Router();

// Public route to get UI settings before login
router.get("/", settings.getSystemSettings);

// Admin route to update settings
router.put("/", verifyJWT, hasRole(["admin"]), settings.updateSystemSettings);

export default router;

import { Router } from "express";
import { triggerDefaulters } from "../controllers/cron.controller.js";

const router = Router();

/**
 * POST /api/v2/cron/trigger-defaulters
 * No JWT middleware here - authentication is done via CRON_SECRET in the controller.
 * This route must NOT be behind verifyJWT because cURL calls it without a user session.
 */
router.post("/trigger-defaulters", triggerDefaulters);

export default router;

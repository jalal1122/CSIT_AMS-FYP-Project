import { Router } from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
const protectedRoute = [verifyJWT];

router.get("/", ...protectedRoute, getNotifications);
router.patch("/read-all", ...protectedRoute, markAllAsRead);
router.patch("/:id/read", ...protectedRoute, markAsRead);
router.delete("/read", ...protectedRoute, clearReadNotifications);
router.delete("/:id", ...protectedRoute, deleteNotification);

export default router;

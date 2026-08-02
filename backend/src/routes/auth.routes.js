import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  setupProfile,
  updatePassword,
  getCurrentUser,
  createAdmin,
  enable2FA,
  verify2FA,
  disable2FA,
  validate2FALogin,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/create-admin", createAdmin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/2fa/validate", validate2FALogin);

// Setup Profile (Must change password gate passes this)
router.post("/setup-profile", verifyJWT, setupProfile);

// Protected routes
router.get("/me", verifyJWT, getCurrentUser);
router.post("/logout", verifyJWT, logoutUser);
router.patch("/update-password", verifyJWT, updatePassword);
router.post("/2fa/enable", verifyJWT, enable2FA);
router.post("/2fa/verify", verifyJWT, verify2FA);
router.post("/2fa/disable", verifyJWT, disable2FA);

export default router;

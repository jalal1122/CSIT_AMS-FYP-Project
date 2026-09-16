import { Router } from "express";
import rateLimit from "express-rate-limit";
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
  updateProfile,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Broad IP-level guard (anti-bot/flood). Per-user lockout (5 attempts → 15 min lock)
// is enforced inside loginUser() at the DB level — this is just a backstop.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 50,                    // 50 attempts per 15 minutes per IP (bot guard)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP. Please try again in 15 minutes." }
});


const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,                     // 5 OTP requests per hour per IP
  message: { success: false, message: "Too many password reset requests. Please try again in an hour." }
});

// Public routes
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/create-admin", createAdmin);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/2fa/validate", validate2FALogin);

// Setup Profile (Must change password gate passes this)
router.post("/setup-profile", verifyJWT, setupProfile);

// Protected routes
router.get("/me", verifyJWT, getCurrentUser);
router.post("/logout", verifyJWT, logoutUser);
router.patch("/update-password", verifyJWT, updatePassword);
router.patch("/update-profile", verifyJWT, updateProfile);
router.post("/2fa/enable", verifyJWT, enable2FA);
router.post("/2fa/verify", verifyJWT, verify2FA);
router.post("/2fa/disable", verifyJWT, disable2FA);

export default router;

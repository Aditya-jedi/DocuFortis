
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  googleLogin,
  verifyMfaLogin,
  enrollMfa,
  enableMfa,
  disableMfa,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  validateResetToken,
} from "../controllers/authController.js";

import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/accountController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

const registrationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

const googleLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many Google sign-in attempts. Please try again later.",
  },
});

const mfaVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many MFA verification attempts. Please try again.",
  },
});

const mfaManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many MFA management attempts. Please try again.",
  },
});

const accountManagementLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many account update attempts. Please try again later.",
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again later.",
  },
});

// Public authentication routes
router.post("/register", registrationLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/google", googleLoginLimiter, googleLogin);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPasswordLimiter, resetPassword);
router.post("/validate-reset-token", resetPasswordLimiter, validateResetToken);
router.post("/mfa/verify", mfaVerificationLimiter, verifyMfaLogin);

// Protected account routes
router.get("/profile", requireAuth, getProfile);
router.patch("/profile", requireAuth, accountManagementLimiter, updateProfile);
router.patch("/change-password", requireAuth, accountManagementLimiter, changePassword);

// Protected authentication routes
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);
router.post("/mfa/enroll", requireAuth, mfaManagementLimiter, enrollMfa);
router.post("/mfa/enable", requireAuth, mfaManagementLimiter, enableMfa);
router.post("/mfa/disable", requireAuth, mfaManagementLimiter, disableMfa);

export default router;

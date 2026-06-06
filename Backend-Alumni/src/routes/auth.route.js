const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyCode,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  logoutUser,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/authMiddleware");
const {
  authLimiter,
  generalLimiter,
  helmetConfig,
  hppProtection,
  sanitizeInput,
  securityMiddleware,
} = require("../middleware/security");
const {
  validateRequest,
  registerSchema,
  loginSchema,
} = require("../middleware/validation");

// ===== Global security middlewares for all routes =====
router.use(helmetConfig); // HTTP headers security
router.use(hppProtection); // HPP protection
router.use(securityMiddleware); // Detect SQLi, XSS, cookies attacks
router.use(sanitizeInput); // Sanitize inputs
router.use(generalLimiter); // Limit general requests

// ===== Public Routes =====


router.post(
  "/register",
  authLimiter, 
  validateRequest(registerSchema),
  registerUser
);


router.post(
  "/login",
  // authLimiter,
  validateRequest(loginSchema),
  loginUser
);


router.post("/forgot-password", authLimiter, forgotPassword);


router.post("/verify-code", authLimiter, verifyCode);


router.post("/reset-password", authLimiter, resetPassword);

// ===== Private Routes =====
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.get("/logout", protect, logoutUser);

module.exports = router;

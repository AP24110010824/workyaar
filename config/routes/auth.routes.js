"use strict";

const express = require("express");
const router = express.Router();

// ==============================
// CONTROLLERS & MIDDLEWARES
// ==============================
const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth"); // JWT verification

/*
|--------------------------------------------------------------------------
| AUTHENTICATION ROUTES
|--------------------------------------------------------------------------
| Handles:
| - Register
| - Login
| - Logout
| - Current logged-in user
| - Jobseeker profile
*/

// ==============================
// REGISTER (Public)
// ==============================
// Body: first_name, last_name, email, password, role_id
router.post(
  "/register",
  authController.register
);

// ==============================
// LOGIN (Public)
// ==============================
// Body: email, password
router.post(
  "/login",
  authController.login
);

// ==============================
// LOGOUT (Protected)
// ==============================
router.post(
  "/logout",
  auth,
  authController.logout
);

// ==============================
// CURRENT USER (Protected)
// ==============================
router.get(
  "/me",
  auth,
  authController.me
);

// ==============================
// GET JOBSEEKER PROFILE
// ==============================
// Used by dashboard to load profile
router.get(
  "/profile",
  auth,
  authController.getProfile
);

// ==============================
// UPDATE JOBSEEKER PROFILE
// ==============================
// Used when user edits profile
router.put(
  "/profile",
  auth,
  authController.updateProfile
);

// ==============================
// VERIFY EMAIL (Public)
// ==============================
router.get(
  "/verify-email/:token",
  authController.verifyEmail
);

// ==============================
// RESEND VERIFICATION EMAIL
// ==============================
router.post(
  "/resend-verification",
  authController.resendVerification
);

// ==============================
// FORGOT PASSWORD
// ==============================
router.post(
  "/forgot-password",
  authController.forgotPassword
);

// ==============================
// RESET PASSWORD
// ==============================
router.post(
  "/reset-password/:token",
  authController.resetPassword
);
module.exports = router;
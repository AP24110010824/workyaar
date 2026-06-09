"use strict";

const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

const adminController = require("../controllers/admin.controller");

/* ======================================================
   GLOBAL MIDDLEWARE (ADMIN ONLY)
====================================================== */
router.use(auth, requireRole(1)); // role_id = 1 (Admin)

/* ======================================================
   DASHBOARD
====================================================== */
router.get("/dashboard", adminController.getDashboardStats);

/* ======================================================
   USERS MANAGEMENT
====================================================== */
router.get("/users", adminController.getUsers);

// Block / Unblock
router.put("/users/:id/status", adminController.updateUserStatus);

// Delete user
router.delete("/users/:id", adminController.deleteUser);

/* ======================================================
   JOB MANAGEMENT
====================================================== */
router.get("/jobs", adminController.getJobs);

// Approve / Reject job
router.put("/jobs/:id/status", adminController.updateJobStatus);

module.exports = router;
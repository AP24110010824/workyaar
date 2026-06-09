"use strict";

const express = require("express");
const router = express.Router();

/* ======================================================
   MIDDLEWARES
====================================================== */

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

/* ======================================================
   CONTROLLER
====================================================== */

const applicationController = require("../controllers/application.controller");



/* ======================================================
   JOBSEEKER ROUTES
   role_id = 1
====================================================== */

// Apply for job
router.post(
  "/jobs/:jobId/apply",
  auth,
  requireRole(1),
  applicationController.applyForJob
);

// Get my applications
router.get(
  "/my-applications",
  auth,
  requireRole(1),
  applicationController.getMyApplications
);

// Withdraw application
router.delete(
  "/:id",
  auth,
  requireRole(1),
  applicationController.withdrawApplication
);

/* ======================================================
   EMPLOYER ROUTES
   role_id = 2
====================================================== */

// 🔥 ADD THIS FIRST
router.get(
  "/employer",
  auth,
  requireRole(2),
  applicationController.getEmployerApplications
);

// Get applicants for a specific job
router.get(
  "/job/:jobId",
  auth,
  requireRole(2),
  applicationController.getApplicationsForJob
);

// Shortlist candidate
router.post(
  "/shortlist",
  auth,
  requireRole(2),
  applicationController.shortlistCandidate
);

// Reject candidate
router.post(
  "/reject",
  auth,
  requireRole(2),
  applicationController.rejectCandidate
);

// 🔥 NEW: Get ALL applications for logged-in employer
router.get(
  "/employer",
  auth,
  requireRole(2),
  applicationController.getEmployerApplications
);

/* ======================================================
   EXPORT ROUTER
====================================================== */

module.exports = router;
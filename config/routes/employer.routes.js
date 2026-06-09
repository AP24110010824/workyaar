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

const employerController = require("../controllers/employer.controller");

/* ======================================================
   FILE UPLOAD
====================================================== */

const uploadLogo = require("../middlewares/uploadLogo");

/* ======================================================
   SAFETY CHECK (🔥 PREVENTS CRASH)
====================================================== */

const safe = (fn, name) => {
  if (!fn) {
    console.error(`❌ MISSING CONTROLLER FUNCTION: ${name}`);
    return (req, res) =>
      res.status(500).json({
        success: false,
        message: `Controller function "${name}" not implemented`
      });
  }
  return fn;
};

/* ======================================================
   GLOBAL MIDDLEWARE
====================================================== */

router.use(auth, requireRole(2));

/* ======================================================
   DASHBOARD
====================================================== */

router.get(
  "/dashboard-stats",
  safe(employerController.getDashboardStats, "getDashboardStats")
);

/* ======================================================
   COMPANY PROFILE (CREATE + UPDATE)
====================================================== */

router.post(
  "/company-profile",
  uploadLogo.single("logo"),
  safe(employerController.saveCompanyProfile, "saveCompanyProfile")
);

router.get(
  "/company-profile",
  safe(employerController.getCompanyProfile, "getCompanyProfile")
);

/* ======================================================
   JOB MANAGEMENT
====================================================== */

router.post(
  "/jobs",
  safe(employerController.createJob, "createJob")
);

router.get(
  "/jobs",
  safe(employerController.getEmployerJobs, "getEmployerJobs")
);

router.put(
  "/jobs/:id",
  safe(employerController.updateJob, "updateJob")
);

router.delete(
  "/jobs/:id",
  safe(employerController.deleteJob, "deleteJob")
);

/* ======================================================
   APPLICATIONS
====================================================== */

router.post(
  "/applications/shortlist",
  safe(employerController.shortlistCandidate, "shortlistCandidate")
);

router.post(
  "/applications/reject",
  safe(employerController.rejectCandidate, "rejectCandidate")
);

// Get all applications for all jobs posted by this employer
router.get(
  "/applications",
  safe(employerController.getAllApplications, "getAllApplications")
);

/* ======================================================
   EXPORT (ONLY ONCE)
====================================================== */

module.exports = router;
"use strict";

const express = require("express");
const router = express.Router();

const pool = require("../config/db");
const jobController = require("../controllers/job.controller");

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");


/*
|--------------------------------------------------------------------------
| JOB CATEGORIES
|--------------------------------------------------------------------------
*/
router.get("/categories", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM wk_job_categories ORDER BY id ASC"
    );

    res.json({ success: true, categories: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/*
|--------------------------------------------------------------------------
| EMPLOYER ROUTES
|--------------------------------------------------------------------------
*/
router.get("/my-jobs", auth, requireRole(2), jobController.getMyJobs);
router.post("/", auth, requireRole(2), jobController.createJob);
//router.put("/:id(\\d+)", auth, requireRole(2), jobController.updateJob);
router.delete("/:id(\\d+)", auth, requireRole(2), jobController.deleteJob);
//router.get("/:jobId(\\d+)/applicants", auth, requireRole(2), jobController.getJobApplicants);


/*
|--------------------------------------------------------------------------
| JOBSEEKER ROUTES
|--------------------------------------------------------------------------
*/
router.post("/:jobId(\\d+)/apply", auth, requireRole(3), jobController.applyJob);
router.get("/my/applications", auth, requireRole(3), jobController.getMyApplications);

router.get("/countries", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name 
       FROM wk_countries 
       WHERE is_active = 1 
       ORDER BY name ASC`
    );

    res.json({
      success: true,
      countries: rows
    });

  } catch (err) {
    console.error("countries error:", err);
    res.status(500).json({ success: false });
  }
});

/*
|--------------------------------------------------------------------------
| PUBLIC ROUTES (LAST)
|--------------------------------------------------------------------------
*/
router.get("/", jobController.getAllJobs);
router.get("/:id(\\d+)", jobController.getJobById);

module.exports = router;
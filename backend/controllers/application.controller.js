"use strict";

const pool = require("../config/db");

/* ======================================================
   HELPERS
====================================================== */

// Get jobseeker id from user
const getJobseekerId = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id FROM wk_jobseekers WHERE user_id = ?",
    [userId]
  );

  return rows.length ? rows[0].id : null;
};

// Get employer id from user
const getEmployerId = async (userId) => {
  const [rows] = await pool.query(
    "SELECT id FROM wk_employers WHERE user_id = ?",
    [userId]
  );

  return rows.length ? rows[0].id : null;
};

/* ======================================================
   APPLY FOR JOB (JOBSEEKER)
====================================================== */

exports.applyForJob = async (req, res) => {
  try {
    const userId = req.user.id;
    const jobId = req.params.jobId;

    const jobseekerId = await getJobseekerId(userId);

    if (!jobseekerId) {
      return res.status(403).json({
        success: false,
        message: "Jobseeker profile not found",
      });
    }

    // Check duplicate application
    const [exists] = await pool.query(
      "SELECT id FROM wk_job_applications WHERE job_id=? AND jobseeker_id=?",
      [jobId, jobseekerId]
    );

    if (exists.length) {
      return res.status(400).json({
        success: false,
        message: "You already applied for this job",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO wk_job_applications
      (job_id, jobseeker_id, status, created_at)
      VALUES (?, ?, 'Applied', NOW())`,
      [jobId, jobseekerId]
    );

    res.status(201).json({
      success: true,
      application_id: result.insertId,
      message: "Application submitted successfully",
    });

  } catch (err) {
    console.error("applyForJob:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


exports.getEmployerApplications = async (req, res) => {
  try {
    const userId = req.user.id;

    const employerId = await getEmployerId(userId);

    if (!employerId) {
      return res.status(403).json({
        success: false,
        message: "Employer profile not found",
      });
    }

    const [applications] = await pool.query(
      `SELECT
        a.id,
        a.status,
        a.created_at,
        j.title AS job_title,
        js.full_name,
        js.email,
        js.phone,
        js.resume_path
      FROM wk_job_applications a
      JOIN wk_jobs j ON a.job_id = j.id
      JOIN wk_jobseekers js ON a.jobseeker_id = js.id
      WHERE j.employer_id = ?
      ORDER BY a.created_at DESC`,
      [employerId]
    );

    res.json({
      success: true,
      applications,
    });

  } catch (err) {
    console.error("getEmployerApplications:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/* ======================================================
   GET JOBSEEKER APPLICATIONS
====================================================== */

exports.getMyApplications = async (req, res) => {
  try {
    const jobseekerId = await getJobseekerId(req.user.id);

    const [applications] = await pool.query(
      `SELECT 
        a.id,
        a.status,
        a.created_at,
        j.title,
        j.location,
        e.company_name
      FROM wk_job_applications a
      JOIN wk_jobs j ON a.job_id = j.id
      JOIN wk_employers e ON j.employer_id = e.id
      WHERE a.jobseeker_id = ?
      ORDER BY a.created_at DESC`,
      [jobseekerId]
    );

    res.json({
      success: true,
      applications,
    });

  } catch (err) {
    console.error("getMyApplications:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ======================================================
   WITHDRAW APPLICATION
====================================================== */

exports.withdrawApplication = async (req, res) => {
  try {
    const jobseekerId = await getJobseekerId(req.user.id);
    const applicationId = req.params.id;

    await pool.query(
      `DELETE FROM wk_job_applications
       WHERE id=? AND jobseeker_id=?`,
      [applicationId, jobseekerId]
    );

    res.json({
      success: true,
      message: "Application withdrawn",
    });

  } catch (err) {
    console.error("withdrawApplication:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ======================================================
   GET APPLICATIONS FOR EMPLOYER JOB
====================================================== */

exports.getApplicationsForJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const [applications] = await pool.query(
      `SELECT
        a.id,
        a.status,
        a.created_at,
        js.full_name,
        js.email,
        js.phone,
        js.resume_path
      FROM wk_job_applications a
      JOIN wk_jobseekers js ON a.jobseeker_id = js.id
      WHERE a.job_id = ?
      ORDER BY a.created_at DESC`,
      [jobId]
    );

    res.json({
      success: true,
      applications,
    });

  } catch (err) {
    console.error("getApplicationsForJob:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ======================================================
   SHORTLIST CANDIDATE
====================================================== */

exports.shortlistCandidate = async (req, res) => {
  try {
    const { application_id } = req.body;

    await pool.query(
      `UPDATE wk_job_applications
       SET status='Shortlisted'
       WHERE id=?`,
      [application_id]
    );

    res.json({
      success: true,
      message: "Candidate shortlisted",
    });

  } catch (err) {
    console.error("shortlistCandidate:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ======================================================
   REJECT CANDIDATE
====================================================== */

exports.rejectCandidate = async (req, res) => {
  try {
    const { application_id } = req.body;

    await pool.query(
      `UPDATE wk_job_applications
       SET status='Rejected'
       WHERE id=?`,
      [application_id]
    );

    res.json({
      success: true,
      message: "Candidate rejected",
    });

  } catch (err) {
    console.error("rejectCandidate:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
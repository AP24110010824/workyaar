"use strict";

const pool = require("../config/db");

/* ======================================================
   HELPERS
====================================================== */

// Get company of logged-in user
const getCompany = async (userId) => {
  const [rows] = await pool.query(
    `SELECT company_id, role
     FROM wk_company_users
     WHERE user_id = ?`,
    [userId]
  );

  return rows.length ? rows[0] : null;
};

// Check permission
const canPostJob = (role) => ["admin", "recruiter"].includes(role);
const isAdmin = (role) => role === "admin";

/* ======================================================
   COMPANY PROFILE
====================================================== */

exports.getCompanyProfile = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company) {
      return res.json({ success: true, profile: null });
    }

    const [rows] = await pool.query(
      "SELECT * FROM wk_company_profiles WHERE company_id=?",
      [company.company_id]
    );

    res.json({
      success: true,
      profile: rows[0] || null
    });

  } catch (err) {
    console.error("getCompanyProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.saveCompanyProfile = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company || !isAdmin(company.role)) {
      return res.status(403).json({ message: "Only admin can update company" });
    }

   const {
  company_name,
  industry,
  company_size,
  location,
  website,
  description,
  linkedin,
  phone,
  email,
  founded_year,
  employer_type,
  gst,
  pwd_hiring
    } = req.body;

    if (!company_name) {
      return res.status(400).json({ message: "Company name is required" });
    }

    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/logos/${req.file.filename}`;
    }

    const [existing] = await pool.query(
      "SELECT id FROM wk_company_profiles WHERE company_id=?",
      [company.company_id]
    );

    if (existing.length) {
      await pool.query(
        `UPDATE wk_company_profiles
         SET company_name=?, industry=?, company_size=?, location=?, website=?,
             description=?, linkedin=?, logo=COALESCE(?, logo), updated_at=NOW()
         WHERE company_id=?`,
        [
          company_name.trim(),
          industry || null,
          company_size || null,
          location || null,
          website || null,
          description || null,
          linkedin || null,
          logoPath,
          company.company_id
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO wk_company_profiles
(
 company_id,
 company_name,
 industry,
 company_size,
 location,
 website,
 description,
 linkedin,
 logo,
 created_at,
 updated_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          company.company_id,
          company_name.trim(),
          industry || null,
          company_size || null,
          location || null,
          website || null,
          description || null,
          linkedin || null,
          logoPath
        ]
      );
    }

    res.json({ success: true });

  } catch (err) {
    console.error("saveCompanyProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   DASHBOARD
====================================================== */

exports.getDashboardStats = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company) {
      return res.json({
        success: true,
        stats: {
  total_jobs: 0,
  total_applications: 0,
  total_shortlisted: 0,
  total_interviews: 0
}
      });
    }

    const companyId = company.company_id;

    const [[jobs]] = await pool.query(
      "SELECT COUNT(*) AS total FROM wk_jobs WHERE company_id=?",
      [companyId]
    );

    const [[applications]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM wk_job_applications a
       JOIN wk_jobs j ON j.id = a.job_id
       WHERE j.company_id=?`,
      [companyId]
    );

    const [[shortlisted]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM wk_job_applications a
       JOIN wk_jobs j ON j.id = a.job_id
       WHERE j.company_id=? AND a.status='shortlisted'`,
      [companyId]
    );

    const [[interviews]] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM wk_job_applications a
       JOIN wk_jobs j ON j.id = a.job_id
       WHERE j.company_id=? AND a.status='processed'`,
      [companyId]
    );

   res.json({
  success: true,
  stats: {
    total_jobs: jobs.total,
    total_applications: applications.total,
    total_shortlisted: shortlisted.total,
    total_interviews: interviews.total
  }
});

  } catch (err) {
    console.error("getDashboardStats:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   JOB MANAGEMENT
====================================================== */

exports.createJob = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company || !canPostJob(company.role)) {
      return res.status(403).json({ message: "No permission to post job" });
    }

    const { category_id, title, description, location } = req.body;

    // ✅ VALIDATION (fixes your error)
    if (!category_id || category_id === "") {
      return res.status(400).json({ message: "Category is required" });
    }

    if (!title) {
      return res.status(400).json({ message: "Job title is required" });
    }

    const [result] = await pool.query(
      `INSERT INTO wk_jobs
       (company_id, category_id, title, description, location, applied_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        company.company_id,
        category_id,
        title.trim(),
        description || null,
        location || null
      ]
    );

    res.json({ success: true, job_id: result.insertId });

  } catch (err) {
    console.error("createJob:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getEmployerJobs = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company) {
      return res.status(403).json({ message: "Company not found" });
    }

    const [jobs] = await pool.query(
      "SELECT * FROM wk_jobs WHERE company_id=? ORDER BY applied_at DESC",
      [company.company_id]
    );

    res.json({ success: true, jobs });

  } catch (err) {
    console.error("getEmployerJobs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company || !canPostJob(company.role)) {
      return res.status(403).json({ message: "No permission" });
    }

    await pool.query(
      "UPDATE wk_jobs SET updated_at=NOW() WHERE id=? AND company_id=?",
      [req.params.id, company.company_id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("updateJob:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company || !isAdmin(company.role)) {
      return res.status(403).json({ message: "Only admin can delete job" });
    }

    await pool.query(
      "DELETE FROM wk_jobs WHERE id=? AND company_id=?",
      [req.params.id, company.company_id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("deleteJob:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   APPLICATIONS
====================================================== */

exports.getAllApplications = async (req, res) => {
  try {
    const company = await getCompany(req.user.id);

    if (!company) {
      return res.status(403).json({ message: "Company not found" });
    }

    const [applications] = await pool.query(`
      SELECT 
        a.id,
        a.status,
        u.full_name,
        u.email,
        j.title
      FROM wk_job_applications a
      JOIN wk_jobs j ON a.job_id = j.id
      JOIN wk_users u ON a.user_id = u.id   -- ✅ FIXED
      WHERE j.company_id = ?
      ORDER BY a.applied_at DESC
    `, [company.company_id]);

    res.json({ success: true, applications });

  } catch (err) {
    console.error("getAllApplications:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   ACTIONS
====================================================== */

exports.shortlistCandidate = async (req, res) => {
  try {
    await pool.query(
      "UPDATE wk_job_applications SET status='shortlisted' WHERE id=?",
      [req.body.application_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("shortlistCandidate:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectCandidate = async (req, res) => {
  try {
    await pool.query(
      "UPDATE wk_job_applications SET status='rejected' WHERE id=?",
      [req.body.application_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("rejectCandidate:", err);
    res.status(500).json({ message: "Server error" });
  }
};
"use strict";

const pool = require("../config/db");

/* ======================================================
   DASHBOARD STATS
====================================================== */
exports.getDashboardStats = async (req, res) => {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM wk_users");
    const [[jobs]] = await pool.query("SELECT COUNT(*) AS total FROM wk_jobs");
    const [[applications]] = await pool.query("SELECT COUNT(*) AS total FROM wk_job_applications");
    const [[companies]] = await pool.query("SELECT COUNT(*) AS total FROM wk_company_profiles");

    res.json({
      success: true,
      stats: {
        users: users.total,
        jobs: jobs.total,
        applications: applications.total,
        companies: companies.total
      }
    });

  } catch (err) {
    console.error("Admin Dashboard Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   GET ALL USERS
====================================================== */
exports.getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id,
        u.full_name AS name,
        u.email,
        u.role_id,
        r.role_name,
        u.account_status_id,
        CASE 
          WHEN u.account_status_id = 1 THEN 1 
          ELSE 0 
        END AS is_active
      FROM wk_users u
      LEFT JOIN wk_user_roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `);

    res.json({ success: true, users });

  } catch (err) {
    console.error("getUsers:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   BLOCK / UNBLOCK USER
====================================================== */
exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Prevent self-block
    if (req.user.id == userId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    await pool.query(
      "UPDATE wk_users SET account_status_id = ? WHERE id = ?",
      [status, userId]
    );

    res.json({
      success: true,
      message: "User status updated"
    });

  } catch (err) {
    console.error("updateUserStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   DELETE USER
====================================================== */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent self delete
    if (req.user.id == userId) {
      return res.status(400).json({ message: "You cannot delete yourself" });
    }

    await pool.query("DELETE FROM wk_users WHERE id = ?", [userId]);

    res.json({
      success: true,
      message: "User deleted"
    });

  } catch (err) {
    console.error("deleteUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   GET ALL JOBS
====================================================== */
exports.getJobs = async (req, res) => {
  try {
    const [jobs] = await pool.query(`
      SELECT 
        j.id,
        j.title,
        j.is_approved,
        cp.company_name
      FROM wk_jobs j
      LEFT JOIN wk_company_profiles cp 
        ON j.company_id = cp.id   -- ✅ FIXED
      ORDER BY j.created_at DESC
    `);

    res.json({
      success: true,
      jobs
    });

  } catch (err) {
    console.error("getJobs:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   APPROVE / REJECT JOB
====================================================== */
exports.updateJobStatus = async (req, res) => {
  try {
    const jobId = req.params.id;
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await pool.query(
      "UPDATE wk_jobs SET is_approved = ? WHERE id = ?",
      [status, jobId]
    );

    res.json({
      success: true,
      message: status ? "Job approved" : "Job rejected"
    });

  } catch (err) {
    console.error("updateJobStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};
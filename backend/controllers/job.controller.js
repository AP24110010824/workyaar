"use strict";

const db = require("../config/db");

/* =====================================================
   PUBLIC JOBS
===================================================== */
exports.getAllJobs = async (req, res) => {

  try {

    const {
      keyword = "",
      country = "",
      state = "",
      city = "",
      remote = ""
    } = req.query;

    let sql = `
      SELECT
        j.id,
        j.title,
        j.description,
        j.location,
        j.salary_min,
        j.salary_max,
        j.job_type,
        j.experience_level,
        j.created_at,

        c.name AS category_name,

        cp.company_name,
        cp.logo,
        cp.employer_type,

        co.name AS country_name,
        st.name AS state_name,
        ci.name AS city_name

      FROM wk_jobs j

      LEFT JOIN wk_job_categories c
        ON c.id = j.category_id

      LEFT JOIN wk_company_profiles cp
        ON cp.company_id = j.company_id

      LEFT JOIN wk_countries co
        ON co.id = j.country_id

      LEFT JOIN wk_states st
        ON st.id = j.state_id

      LEFT JOIN wk_cities ci
        ON ci.id = j.city_id

      WHERE j.is_active = 1
    `;

    const params = [];

    /* ================= KEYWORD ================= */
    if (keyword) {
      sql += `
        AND (
          j.title LIKE ?
          OR j.description LIKE ?
          OR c.name LIKE ?
        )
      `;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    /* ================= COUNTRY ================= */
    if (country) {
      sql += ` AND j.country_id = ? `;
      params.push(country);
    }

    /* ================= STATE ================= */
    if (state) {
      sql += ` AND j.state_id = ? `;
      params.push(state);
    }

    /* ================= CITY ================= */
    if (city) {
      sql += ` AND j.city_id = ? `;
      params.push(city);
    }

    /* ================= REMOTE ================= */
    if (remote === "remote") {
      sql += ` AND j.job_type = 'Remote' `;
    }

    sql += ` ORDER BY j.id DESC LIMIT 50`;

    const [jobs] = await db.execute(sql, params);

    return res.json({
      success: true,
      jobs
    });

  } catch (err) {

    console.error("getAllJobs:", err);

    return res.status(500).json({
      success: false
    });

  }
};


/* =====================================================
   GET MY JOBS (FIXED)
===================================================== */
exports.getMyJobs = async (req, res) => {

  try {

    console.log("REQ USER:", req.user);

    // ✅ FIXED: use company_id (NOT id)
    const employerId = req.user.company_id;

    const [jobs] = await db.execute(
      `SELECT
        j.id,
        j.title,
        j.location,
        j.salary_min,
        j.salary_max,
        j.is_active,
        j.created_at,

        c.name AS category_name,

        cp.company_name,
        cp.employer_type,
        cp.logo

      FROM wk_jobs j

      LEFT JOIN wk_job_categories c
        ON c.id = j.category_id

      LEFT JOIN wk_company_profiles cp
        ON cp.company_id = j.company_id

      WHERE j.company_id = ?

      ORDER BY j.id DESC`,
      [employerId]
    );

    return res.json({
      success: true,
      jobs
    });

  } catch (err) {

    console.error("getMyJobs:", err);

    return res.status(500).json({
      success: false
    });

  }
};


/* =====================================================
   CREATE JOB (FIXED)
===================================================== */
exports.createJob = async (req, res) => {

  try {

    // ✅ FIXED: use company_id only
    const employerId = req.user.company_id;

    const {
      title,
      description,
      location,
      salary_min,
      salary_max,
      category_id,
      job_type,
      experience_level
    } = req.body;

    if (!title || !description || !category_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    await db.execute(
      `INSERT INTO wk_jobs
      (
        company_id,
        category_id,
        title,
        description,
        location,
        salary_min,
        salary_max,
        job_type,
        experience_level,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        employerId,
        category_id,
        title,
        description,
        location || null,
        salary_min || null,
        salary_max || null,
        job_type || "Full-time",
        experience_level || null
      ]
    );

    return res.json({
      success: true,
      message: "Job created successfully"
    });

  } catch (err) {

    console.error("createJob:", err);

    return res.status(500).json({
      success: false
    });

  }
};


/* =====================================================
   UPDATE JOB (FIXED)
===================================================== */
exports.updateJob = async (req, res) => {

  try {

    const employerId = req.user.company_id; // ✅ FIXED
    const jobId = req.params.id;

    const {
      title,
      description,
      location,
      salary_min,
      salary_max,
      category_id,
      job_type,
      experience_level,
      is_active
    } = req.body;

    const [result] = await db.execute(
      `UPDATE wk_jobs SET
        title=?,
        description=?,
        location=?,
        salary_min=?,
        salary_max=?,
        category_id=?,
        job_type=?,
        experience_level=?,
        is_active=?
      WHERE id=? AND company_id=?`,
      [
        title,
        description,
        location,
        salary_min,
        salary_max,
        category_id,
        job_type,
        experience_level,
        is_active ?? 1,
        jobId,
        employerId
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.json({
      success: true,
      message: "Job updated"
    });

  } catch (err) {

    console.error("updateJob:", err);

    return res.status(500).json({
      success: false
    });

  }
};


/* =====================================================
   DELETE JOB (FIXED)
===================================================== */
exports.deleteJob = async (req, res) => {

  try {

    const employerId = req.user.company_id; // ✅ FIXED
    const jobId = req.params.id;

    const [result] = await db.execute(
      `DELETE FROM wk_jobs
       WHERE id=? AND company_id=?`,
      [jobId, employerId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.json({
      success: true
    });

  } catch (err) {

    console.error("deleteJob:", err);

    return res.status(500).json({
      success: false
    });

  }
};


/* =====================================================
   APPLY JOB
===================================================== */
exports.applyJob = async (req, res) => {

  try {

    const userId = req.user.id;
    const jobId = req.params.jobId;

    const [exists] = await db.execute(
      `SELECT id FROM wk_job_applications
       WHERE job_id=? AND user_id=?`,
      [jobId, userId]
    );

    if (exists.length) {
      return res.status(400).json({
        success: false,
        message: "Already applied"
      });
    }

    await db.execute(
      `INSERT INTO wk_job_applications
      (
        job_id,
        user_id,
        status,
        applied_at
      )
      VALUES (?, ?, 'applied', NOW())`,
      [jobId, userId]
    );

    return res.json({
      success: true,
      message: "Applied successfully"
    });

  } catch (err) {

    console.error("applyJob:", err);

    return res.status(500).json({
      success: false
    });

  }
};


/* =====================================================
   GET MY APPLICATIONS
===================================================== */
exports.getMyApplications = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.execute(
      `SELECT
        a.id,
        a.status,
        a.applied_at,

        j.title,
        j.location,

        cp.company_name,
        cp.logo

      FROM wk_job_applications a

      JOIN wk_jobs j
        ON j.id = a.job_id

      LEFT JOIN wk_company_profiles cp
        ON cp.company_id = j.company_id

      WHERE a.user_id = ?

      ORDER BY a.id DESC`,
      [userId]
    );

    return res.json({
      success: true,
      applications: rows
    });

  } catch (err) {

    console.error("getMyApplications:", err);

    return res.status(500).json({
      success: false
    });

  }
};


/* =====================================================
   GET JOB BY ID
===================================================== */
exports.getJobById = async (req, res) => {

  try {

    const jobId = req.params.id;

    const [rows] = await db.execute(
      `SELECT
        j.*,
        c.name AS category_name,
        cp.company_name,
        cp.logo,
        cp.employer_type

      FROM wk_jobs j

      LEFT JOIN wk_job_categories c
        ON c.id = j.category_id

      LEFT JOIN wk_company_profiles cp
        ON cp.company_id = j.company_id

      WHERE j.id=?`,
      [jobId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    return res.json({
      success: true,
      job: rows[0]
    });

  } catch (err) {

    console.error("getJobById:", err);

    return res.status(500).json({
      success: false
    });

  }
};
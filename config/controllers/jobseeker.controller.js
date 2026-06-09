"use strict";

const db = require("../config/db");


/* ======================================================
   GET PROFILE
====================================================== */
exports.getProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT
        u.id,
        CONCAT(u.first_name,' ',u.last_name) AS full_name,
        u.email,
        p.phone,
        p.city AS location,
        j.career,
        j.summary,
        r.file_path AS resume_path,
        u.created_at
      FROM wk_users u
      LEFT JOIN wk_user_profiles p ON p.user_id = u.id
      LEFT JOIN wk_jobseekers j ON j.user_id = u.id
      LEFT JOIN wk_resumes r ON r.user_id = u.id
      WHERE u.id = ?
      ORDER BY r.created_at DESC
      LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      profile: rows[0] || {}
    });

  } catch (error) {

    console.error("Profile Error:", error);

  res.status(500).json({
  success: false,
  message: "Failed to load profile"
});
  }

};


/* ======================================================
   UPDATE PROFILE
====================================================== */
exports.updateProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const {
      full_name,
      phone,
      location,
      career,
      summary
    } = req.body;

    const parts = full_name.split(" ");
    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");

    await db.query(
      `UPDATE wk_users
       SET first_name = ?, last_name = ?
       WHERE id = ?`,
      [firstName, lastName, userId]
    );

    await db.query(
      `UPDATE wk_user_profiles
       SET phone = ?, city = ?
       WHERE user_id = ?`,
      [phone, location, userId]
    );

    await db.query(
      `UPDATE wk_jobseekers
       SET career = ?, summary = ?
       WHERE user_id = ?`,
      [career, summary, userId]
    );

    res.json({
      success: true,
      message: "Profile updated"
    });

  } catch (error) {

    console.error("Update Profile Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update profile"
    });

  }

};
/* ======================================================
   GET RESUME
====================================================== */
exports.getResume = async (req, res) => {
  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT file_path
       FROM wk_resumes
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.json({ resume_path: null });
    }

    res.json({
  success: true,
  resume_path: rows[0].file_path
});

  } catch (error) {
    console.error("Get Resume Error:", error);
    res.status(500).json({ success: false });
  }
};

/* ======================================================
   UPLOAD RESUME
====================================================== */
exports.uploadResume = async (req, res) => {

  try {

    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    await db.query(
      `INSERT INTO wk_resumes
       (user_id,file_name,file_path,file_size)
       VALUES (?,?,?,?)`,
      [
        userId,
        req.file.originalname,
        `/uploads/resumes/${req.file.filename}`,
        req.file.size
      ]
    );

    res.json({
      success: true,
      message: "Resume uploaded"
    });

  } catch (error) {

    console.error("Resume Upload Error:", error);

    res.status(500).json({
      success: false,
      message: "Resume upload failed"
    });

  }

};


/* ======================================================
   GET SKILLS
====================================================== */
exports.getSkills = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, skill_name
       FROM wk_jobseeker_skills
       WHERE jobseeker_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      skills: rows
    });

  } catch (error) {

    console.error("Get Skills Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   ADD SKILL
====================================================== */
exports.addSkill = async (req, res) => {

  try {

    const userId = req.user.id;
    const { skill_name } = req.body;

    await db.query(
      `INSERT INTO wk_jobseeker_skills
       (jobseeker_id, skill_name)
       VALUES (?,?)`,
      [userId, skill_name]
    );

    res.json({
      success: true,
      message: "Skill added"
    });

  } catch (error) {

    console.error("Add Skill Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   DELETE SKILL
====================================================== */
exports.deleteSkill = async (req, res) => {

  try {

    const id = req.params.id;

    await db.query(
      `DELETE FROM wk_jobseeker_skills
       WHERE id = ?`,
      [id]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error("Delete Skill Error:", error);

    res.status(500).json({
      success: false
    });

  }

};

/* ======================================================
   DELETE EXPERIENCE
====================================================== */
exports.deleteExperience = async (req, res) => {
  try {
    const id = req.params.id;

    await db.query(
      `DELETE FROM wk_jobseeker_experience
       WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Experience deleted"
    });
  } catch (error) {
    console.error("Delete Experience Error:", error);
    res.status(500).json({ success: false });
  }
};

/* ======================================================
   GET EXPERIENCE
====================================================== */
exports.getExperience = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT id, company, role, years
       FROM wk_jobseeker_experience
       WHERE jobseeker_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      experience: rows
    });

  } catch (error) {

    console.error("Experience Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   ADD EXPERIENCE
====================================================== */
exports.addExperience = async (req, res) => {

  try {

    const userId = req.user.id;

    const { company, role, years } = req.body;

    await db.query(
      `INSERT INTO wk_jobseeker_experience
       (jobseeker_id,company,role,years)
       VALUES (?,?,?,?)`,
      [userId, company, role, years]
    );

    res.json({
      success: true
    });

  } catch (error) {

    console.error("Add Experience Error:", error);

    res.status(500).json({
      success: false
    });

  }

};



/* ======================================================
   APPLY JOB
====================================================== */
exports.applyJob = async (req, res) => {

  try {

    const userId = req.user.id;
    const { job_id } = req.body;

    await db.query(
      `INSERT INTO wk_job_applications
       (job_id,jobseeker_id,applied_at)
       VALUES (?,?,NOW())`,
      [job_id, userId]
    );

    res.json({
      success: true,
      message: "Job applied"
    });

  } catch (error) {

    console.error("Apply Job Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   GET APPLIED JOBS
====================================================== */
exports.getAppliedJobs = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT
        a.id,
        j.title,
        j.location,
        j.salary,
        a.applied_at
       FROM wk_job_applications a
       JOIN wk_jobs j ON j.id = a.job_id
       WHERE a.jobseeker_id = ?
       ORDER BY a.applied_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      jobs: rows
    });

  } catch (error) {

    console.error("Applied Jobs Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   SAVE JOB
====================================================== */
exports.saveJob = async (req, res) => {

  try {

    const userId = req.user.id;
    const { job_id } = req.body;

    await db.query(
      `INSERT INTO wk_saved_jobs
       (job_id,jobseeker_id)
       VALUES (?,?)`,
      [job_id, userId]
    );

    res.json({
      success: true,
      message: "Job saved"
    });

  } catch (error) {

    console.error("Save Job Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   GET SAVED JOBS
====================================================== */
exports.getSavedJobs = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT
        s.id,
        j.title,
        j.location,
        j.salary
       FROM wk_saved_jobs s
       JOIN wk_jobs j ON j.id = s.job_id
       WHERE s.jobseeker_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      jobs: rows
    });

  } catch (error) {

    console.error("Saved Jobs Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   JOB RECOMMENDATIONS
====================================================== */
exports.getRecommendedJobs = async (req, res) => {

  try {

    const userId = req.user.id;

    const [skills] = await db.query(
      `SELECT skill_name
       FROM wk_jobseeker_skills
       WHERE jobseeker_id = ?`,
      [userId]
    );

    const skillList = skills.map(s => s.skill_name);

    if (!skillList.length) {
      return res.json({ success:true,jobs:[] });
    }

    const [jobs] = await db.query(
      `SELECT id,title,location,salary
       FROM wk_jobs
       ORDER BY created_at DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      jobs
    });

  } catch (error) {

    console.error("Recommendation Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   DASHBOARD STATS
====================================================== */
exports.getDashboardStats = async (req, res) => {

  try {

    const userId = req.user.id;

    const [[applied]] = await db.query(
      `SELECT COUNT(*) total
       FROM wk_job_applications
       WHERE jobseeker_id = ?`,
      [userId]
    );

    const [[saved]] = await db.query(
      `SELECT COUNT(*) total
       FROM wk_saved_jobs
       WHERE jobseeker_id = ?`,
      [userId]
    );

    const [[skills]] = await db.query(
      `SELECT COUNT(*) total
       FROM wk_jobseeker_skills
       WHERE jobseeker_id = ?`,
      [userId]
    );

    res.json({
      success:true,
      stats:{
        applied_jobs:applied.total,
        saved_jobs:saved.total,
        skills:skills.total
      }
    });

  } catch (error) {

    console.error("Dashboard Stats Error:", error);

    res.status(500).json({
      success:false
    });

  }

};
/* ======================================================
   SAVE PREFERENCES
====================================================== */
exports.savePreferences = async (req, res) => {

  try {

    const userId = req.user.id;

    const {
      job_type_id,
      preferred_location,
      expected_salary,
      industry,
      work_mode,
      notice_period
    } = req.body;

    const [rows] = await db.query(
      `SELECT id FROM wk_user_job_preferences WHERE user_id=?`,
      [userId]
    );

    if (rows.length) {

      await db.query(
        `UPDATE wk_user_job_preferences
         SET job_type_id=?, preferred_location=?, expected_salary=?, industry=?, work_mode=?, notice_period=?
         WHERE user_id=?`,
        [
          job_type_id,
          preferred_location,
          expected_salary,
          industry,
          work_mode,
          notice_period,
          userId
        ]
      );

    } else {

      await db.query(
        `INSERT INTO wk_user_job_preferences
         (user_id, job_type_id, preferred_location, expected_salary, industry, work_mode, notice_period)
         VALUES (?,?,?,?,?,?,?)`,
        [
          userId,
          job_type_id,
          preferred_location,
          expected_salary,
          industry,
          work_mode,
          notice_period
        ]
      );

    }

    res.json({
      success: true,
      message: "Preferences saved"
    });

  } catch (error) {

    console.error("Save Preferences Error:", error);

    res.status(500).json({
      success: false
    });

  }

};


/* ======================================================
   GET PREFERENCES
====================================================== */
exports.getPreferences = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT p.*, jt.name AS job_type_name
       FROM wk_user_job_preferences p
       LEFT JOIN wk_job_types jt ON jt.id = p.job_type_id
       WHERE p.user_id=?`,
      [userId]
    );

    res.json({
      success: true,
      preferences: rows[0] || {}
    });

  } catch (error) {

    console.error("Get Preferences Error:", error);

    res.status(500).json({
      success: false
    });

  }

};

/* ======================================================
   GET JOB PREFERENCES
====================================================== */
/* exports.getPreferences = async (req, res) => {
  try {

    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT *
       FROM wk_user_job_preferences
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      preferences: rows[0] || {}
    });

  } catch (error) {
    console.error("Get Preferences Error:", error);
    res.status(500).json({ success: false });
  }
};*/


/* ======================================================
   SAVE / UPDATE JOB PREFERENCES
====================================================== */
exports.savePreferences = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      job_type,
      work_mode,
      preferred_location,
      expected_salary,
      industry,
      notice_period
    } = req.body;

    // CHECK EXIST
    const [rows] = await db.query(
      `SELECT id FROM wk_user_job_preferences WHERE user_id = ?`,
      [userId]
    );

    if (rows.length) {
      // UPDATE
      await db.query(
        `UPDATE wk_user_job_preferences
         SET job_type=?,
             work_mode=?,
             preferred_location=?,
             expected_salary=?,
             industry=?,
             notice_period=?
         WHERE user_id=?`,
        [
          job_type,
          work_mode,
          preferred_location,
          expected_salary,
          industry,
          notice_period,
          userId
        ]
      );
    } else {
      // INSERT
      await db.query(
        `INSERT INTO wk_user_job_preferences
        (user_id,job_type,work_mode,preferred_location,expected_salary,industry,notice_period)
        VALUES (?,?,?,?,?,?,?)`,
        [
          userId,
          job_type,
          work_mode,
          preferred_location,
          expected_salary,
          industry,
          notice_period
        ]
      );
    }

    res.json({
      success: true,
      message: "Preferences saved"
    });

  } catch (error) {
    console.error("Save Preferences Error:", error);
    res.status(500).json({ success: false });
  }
};
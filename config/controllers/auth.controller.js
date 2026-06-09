"use strict";

const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
  sendVerificationEmail,
  sendResetPasswordEmail
} = require("../services/email.service");

/* ======================================================
   SAFETY CHECK
====================================================== */
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing");
  process.exit(1);
}

/* ======================================================
   REGISTER
====================================================== */
exports.register = async (req, res) => {

  const {
    full_name,
    email,
    password,
    role_id,
    category_type,
    job_type_id,
    referral_code,
    source
  } = req.body;

  if (!full_name || !email || !password || !role_id || !category_type || !source) {
    return res.status(400).json({
      message: "All required fields missing"
    });
  }

  if (Number(role_id) === 3 && !job_type_id) {
    return res.status(400).json({
      message: "Work type required for job seekers"
    });
  }

  const connection = await pool.getConnection();

  try {

    await connection.beginTransaction();

    /* CHECK EMAIL */
    const [existing] = await connection.query(
      "SELECT id FROM wk_users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "Email already registered"
      });
    }

    /* CHECK ROLE */
    const [roles] = await connection.query(
      "SELECT id FROM wk_user_roles WHERE id = ?",
      [role_id]
    );

    if (!roles.length) {
      await connection.rollback();

      return res.status(400).json({
        message: "Invalid role selected"
      });
    }

    /* HASH PASSWORD */
    const password_hash = await bcrypt.hash(password, 10);

    /* SPLIT NAME */
    const names = full_name.trim().split(" ");

    const first_name = names[0] || null;

    const last_name = names.slice(1).join(" ") || null;

    /* EMAIL TOKEN */
    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const verificationExpires =
      new Date(Date.now() + 24 * 60 * 60 * 1000);

    /* INSERT USER */
    const [result] = await connection.query(
      `INSERT INTO wk_users
       (
         role_id,
         first_name,
         last_name,
         full_name,
         email,
         password_hash,
         category_type,
         job_type_id,
         referral_code,
         source,
         account_status_id,
         is_verified,
         verification_token,
         verification_expires,
         created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, NOW())`,
      [
        role_id,
        first_name,
        last_name,
        full_name,
        email,
        password_hash,
        category_type,
        Number(role_id) === 3 ? job_type_id : null,
        referral_code || null,
        source,
        process.env.NODE_ENV === "development" ? 1 : 0,  // auto-verify in dev
        verificationToken,
        verificationExpires
      ]
    );

    const userId = result.insertId;

    /* EMPLOYER FLOW */
    if (Number(role_id) === 2) {

      const [companyResult] = await connection.query(
        `INSERT INTO wk_companies
         (company_name, created_by)
         VALUES (?, ?)`,
        [`${full_name}'s Company`, userId]
      );

      const companyId = companyResult.insertId;

      await connection.query(
        `INSERT INTO wk_company_users
         (user_id, company_id, role)
         VALUES (?, ?, 'admin')`,
        [userId, companyId]
      );

      await connection.query(
        `INSERT INTO wk_company_profiles
         (company_id, company_name)
         VALUES (?, ?)`,
        [companyId, `${full_name}'s Company`]
      );
    }

    /* JOB SEEKER */
    if (Number(role_id) === 3) {
      await connection.query(
        `INSERT INTO wk_jobseekers (user_id)
         VALUES (?)`,
        [userId]
      );
    }

    /* SEND EMAIL (non-blocking — don't fail registration if SMTP fails) */
    try {
      await sendVerificationEmail(
        email,
        full_name,
        verificationToken
      );
    } catch (emailErr) {
      console.warn("⚠️  Verification email failed (SMTP):", emailErr.message);
    }

    await connection.commit();

    connection.release();

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email."
    });

  } catch (err) {

    await connection.rollback();

    connection.release();

    console.error("REGISTER ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   VERIFY EMAIL
====================================================== */
exports.verifyEmail = async (req, res) => {

  try {

    const { token } = req.params;

    const [users] = await pool.query(
      `SELECT id
       FROM wk_users
       WHERE verification_token = ?
       AND verification_expires > NOW()
       LIMIT 1`,
      [token]
    );

    if (!users.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    await pool.query(
      `UPDATE wk_users
       SET
         is_verified = 1,
         verification_token = NULL,
         verification_expires = NULL
       WHERE id = ?`,
      [users[0].id]
    );

    res.json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (err) {

    console.error("VERIFY EMAIL ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   RESEND VERIFICATION
====================================================== */
exports.resendVerification = async (req, res) => {

  try {

    const { email } = req.body;

    const [users] = await pool.query(
      `SELECT id, full_name, is_verified
       FROM wk_users
       WHERE email = ?`,
      [email]
    );

    if (!users.length) {
      return res.json({
        success: true,
        message:
          "If account exists, verification email sent"
      });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({
        message: "Email already verified"
      });
    }

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const verificationExpires =
      new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `UPDATE wk_users
       SET
         verification_token = ?,
         verification_expires = ?
       WHERE id = ?`,
      [
        verificationToken,
        verificationExpires,
        user.id
      ]
    );

    await sendVerificationEmail(
      email,
      user.full_name,
      verificationToken
    );

    res.json({
      success: true,
      message: "Verification email resent"
    });

  } catch (err) {

    console.error("RESEND VERIFY ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   LOGIN
====================================================== */
exports.login = async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password required"
    });
  }

  try {

    const [users] = await pool.query(
      `SELECT
        id,
        password_hash,
        role_id,
        account_status_id,
        is_verified
       FROM wk_users
       WHERE email = ?`,
      [email]
    );

    if (!users.length) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const user = users[0];

    const ok = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!ok) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email"
      });
    }

    if (user.account_status_id !== 1) {
      return res.status(403).json({
        message: "Account not active"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role_id: Number(user.role_id)
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    const token_hash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await pool.query(
      `INSERT INTO wk_jwt_tokens
       (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, token_hash]
    );

    await pool.query(
      `INSERT INTO wk_login_history
       (user_id, ip_address, user_agent)
       VALUES (?, ?, ?)`,
      [
        user.id,
        req.ip,
        req.headers["user-agent"] || null
      ]
    );

    await pool.query(
      `UPDATE wk_users
       SET last_login_at = NOW()
       WHERE id = ?`,
      [user.id]
    );

    res.json({
      success: true,
      token,
      role_id: Number(user.role_id)
    });

  } catch (err) {

    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   FORGOT PASSWORD
====================================================== */
exports.forgotPassword = async (req, res) => {

  try {

    const { email } = req.body;

    const [users] = await pool.query(
      `SELECT id, full_name
       FROM wk_users
       WHERE email = ?`,
      [email]
    );

    if (!users.length) {
      return res.json({
        success: true,
        message:
          "If account exists, reset link sent"
      });
    }

    const user = users[0];

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    const resetExpires =
      new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      `UPDATE wk_users
       SET
         reset_token = ?,
         reset_expires = ?
       WHERE id = ?`,
      [
        resetToken,
        resetExpires,
        user.id
      ]
    );

    await sendResetPasswordEmail(
      email,
      user.full_name,
      resetToken
    );

    res.json({
      success: true,
      message:
        "If account exists, reset link sent"
    });

  } catch (err) {

    console.error("FORGOT PASSWORD ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   RESET PASSWORD
====================================================== */
exports.resetPassword = async (req, res) => {

  try {

    const { token } = req.params;

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        message: "Password required"
      });
    }

    const [users] = await pool.query(
      `SELECT id
       FROM wk_users
       WHERE reset_token = ?
       AND reset_expires > NOW()
       LIMIT 1`,
      [token]
    );

    if (!users.length) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    const password_hash =
      await bcrypt.hash(password, 10);

    await pool.query(
      `UPDATE wk_users
       SET
         password_hash = ?,
         reset_token = NULL,
         reset_expires = NULL
       WHERE id = ?`,
      [
        password_hash,
        users[0].id
      ]
    );

    res.json({
      success: true,
      message: "Password reset successful"
    });

  } catch (err) {

    console.error("RESET PASSWORD ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   LOGOUT
====================================================== */
exports.logout = async (req, res) => {

  try {

    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(400).json({
        message: "Token required"
      });
    }

    const token = auth.split(" ")[1];

    const token_hash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    await pool.query(
      `UPDATE wk_jwt_tokens
       SET revoked = 1
       WHERE token_hash = ?`,
      [token_hash]
    );

    res.json({
      success: true
    });

  } catch (err) {

    console.error("LOGOUT ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   CURRENT USER
====================================================== */
exports.me = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
        id,
        full_name,
        email,
        role_id,
        category_type,
        job_type_id,
        is_verified
       FROM wk_users
       WHERE id = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({
      user: rows[0]
    });

  } catch (err) {

    console.error("ME ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};

/* ======================================================
   GET PROFILE
====================================================== */
exports.getProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
        full_name,
        email,
        mobile,
        location,
        skills,
        experience,
        career,
        certifications,
        education,
        summary,
        description,
        profile_photo,
        resume_path
       FROM wk_jobseekers
       WHERE user_id = ?`,
      [userId]
    );

    res.json(rows[0] || {});

  } catch (err) {

    console.error("PROFILE ERROR:", err);

    res.status(500).json({
      message: "Server error"
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
      email,
      mobile,
      location,
      skills,
      experience,
      career,
      certifications,
      education,
      summary,
      description
    } = req.body;

    await pool.query(
      `UPDATE wk_jobseekers
       SET
         full_name = ?,
         email = ?,
         mobile = ?,
         location = ?,
         skills = ?,
         experience = ?,
         career = ?,
         certifications = ?,
         education = ?,
         summary = ?,
         description = ?
       WHERE user_id = ?`,
      [
        full_name,
        email,
        mobile,
        location,
        skills,
        experience,
        career,
        certifications,
        education,
        summary,
        description,
        userId
      ]
    );

    res.json({
      success: true,
      message: "Profile updated successfully"
    });

  } catch (err) {

    console.error("PROFILE UPDATE ERROR:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
};
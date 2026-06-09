"use strict";

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../config/db");

module.exports = async (req, res, next) => {
  try {

    /* =====================================
       1️⃣ CHECK AUTH HEADER
    ====================================== */
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    /* =====================================
       2️⃣ VERIFY JWT
    ====================================== */
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token"
      });
    }

    if (!decoded.id || !decoded.role_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token payload"
      });
    }

    /* =====================================
       3️⃣ CHECK TOKEN IN DB
    ====================================== */
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const [tokens] = await db.query(
      `SELECT id
       FROM wk_jwt_tokens
       WHERE token_hash = ?
       AND revoked = 0
       AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (!tokens.length) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token expired or revoked"
      });
    }

    /* =====================================
       4️⃣ BUILD USER OBJECT
    ====================================== */

    const user = {
      id: Number(decoded.id),
      role_id: Number(decoded.role_id)
    };

    /* =====================================
       5️⃣ COMPANY SYSTEM (EMPLOYER ONLY)
    ====================================== */

    if (user.role_id === 2) {

      const [companyUser] = await db.query(
        `SELECT company_id, role
         FROM wk_company_users
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [user.id]
      );

      if (!companyUser.length) {
        return res.status(403).json({
          success: false,
          message: "Company not assigned. Please contact admin."
        });
      }

      user.company_id = companyUser[0].company_id;
      user.company_role = companyUser[0].role;
    }

    /* =====================================
       6️⃣ ADMIN SYSTEM
    ====================================== */

    if (user.role_id === 1) {

      const [admin] = await db.query(
        `SELECT admin_role_id
         FROM wk_admin_users
         WHERE user_id = ?
         LIMIT 1`,
        [user.id]
      );

      if (!admin.length) {
        return res.status(403).json({
          success: false,
          message: "Admin not configured"
        });
      }

      user.admin_role_id = admin[0].admin_role_id;
    }

    /* =====================================
       7️⃣ JOB SEEKER
    ====================================== */

    if (user.role_id === 3) {
      user.jobseeker = true;
    }

    /* =====================================
       8️⃣ MODERATOR
    ====================================== */

    if (user.role_id === 4) {
      user.moderator = true;
    }

    /* =====================================
       9️⃣ ATTACH USER
    ====================================== */

    req.user = user;

    next();

  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({
      success: false,
      message: "Unauthorized"
    });
  }
};
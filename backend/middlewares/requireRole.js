"use strict";

module.exports = function requireRole(...allowedRoles) {

  return async (req, res, next) => {

    try {

      if (!req.user || typeof req.user.role_id === "undefined") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: No role assigned"
        });
      }

      const userId = req.user.id;
      const userRole = Number(req.user.role_id);
      const normalizedRoles = allowedRoles.map(r => Number(r));

      /* =====================================
         1️⃣ ROLE CHECK FIRST
      ====================================== */
      if (!normalizedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Access denied"
        });
      }

      /* =====================================
         2️⃣ ADMIN HANDLING
      ====================================== */
      if (userRole === 1) {

        if (!req.user.admin_role_id) {
          return res.status(403).json({
            success: false,
            message: "Admin not configured"
          });
        }

        req.admin = {
          admin_role_id: req.user.admin_role_id
        };
      }

      /* =====================================
         3️⃣ EMPLOYER (COMPANY USER)
      ====================================== */
      if (userRole === 2) {

        if (!req.user.company_id) {
          return res.status(403).json({
            success: false,
            message: "Company access not assigned"
          });
        }

        req.company = {
          company_id: req.user.company_id,
          role: req.user.company_role
        };
      }

      /* =====================================
         4️⃣ JOB SEEKER (NO EXTRA CHECK)
      ====================================== */
      if (userRole === 3) {
        req.jobseeker = {
          user_id: userId
        };
      }

      /* =====================================
         5️⃣ MODERATOR (OPTIONAL)
      ====================================== */
      if (userRole === 4) {
        req.moderator = {
          user_id: userId
        };
      }

      next();

    } catch (err) {
      console.error("❌ ROLE MIDDLEWARE ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }

  };
};
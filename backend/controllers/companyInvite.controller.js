"use strict";

const pool = require("../config/db");
const crypto = require("crypto");

/* ======================================================
   HELPER: GET COMPANY ID FROM USER
====================================================== */
const getCompanyId = async (userId) => {
  const [rows] = await pool.query(
    "SELECT company_id FROM wk_company_users WHERE user_id=? LIMIT 1",
    [userId]
  );
  return rows.length ? rows[0].company_id : null;
};

/* ======================================================
   SEND INVITE
====================================================== */
exports.sendInvite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, role } = req.body;

    const companyId = await getCompanyId(userId);

    if (!companyId) {
      return res.status(403).json({ message: "No company access" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `INSERT INTO wk_company_invites
       (company_id, email, role, token, created_by, expires_at)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 2 DAY))`,
      [companyId, email, role || "recruiter", token, userId]
    );

    // 👉 TODO: send email here
    // link: https://yourdomain.com/accept-invite?token=xxxx

    res.json({
      success: true,
      message: "Invite sent",
      token // remove in production (for testing only)
    });

  } catch (err) {
    console.error("sendInvite:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   ACCEPT INVITE
====================================================== */
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const [invites] = await pool.query(
      "SELECT * FROM wk_company_invites WHERE token=? AND status='pending'",
      [token]
    );

    if (!invites.length) {
      return res.status(400).json({ message: "Invalid invite" });
    }

    const invite = invites[0];

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({ message: "Invite expired" });
    }

    // Add user to company
    await pool.query(
      `INSERT INTO wk_company_users (company_id, user_id, role)
       VALUES (?, ?, ?)`,
      [invite.company_id, userId, invite.role]
    );

    // Mark invite accepted
    await pool.query(
      `UPDATE wk_company_invites SET status='accepted' WHERE id=?`,
      [invite.id]
    );

    res.json({
      success: true,
      message: "Joined company successfully"
    });

  } catch (err) {
    console.error("acceptInvite:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   LIST INVITES
====================================================== */
exports.getInvites = async (req, res) => {
  try {
    const companyId = await getCompanyId(req.user.id);

    const [rows] = await pool.query(
      "SELECT * FROM wk_company_invites WHERE company_id=? ORDER BY created_at DESC",
      [companyId]
    );

    res.json({ success: true, invites: rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   CANCEL INVITE
====================================================== */
exports.cancelInvite = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE wk_company_invites SET status='expired' WHERE id=?",
      [id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
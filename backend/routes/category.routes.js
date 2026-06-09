"use strict";

const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ✅ GET JOB CATEGORIES
router.get("/", async (req, res) => {
  try {

    const [rows] = await pool.query(
      `SELECT id, name 
       FROM wk_job_categories 
       WHERE status = 1 
       ORDER BY sort_order ASC`
    );

    res.json({
      success: true,
      categories: rows
    });

  } catch (err) {
    console.error("getCategories:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
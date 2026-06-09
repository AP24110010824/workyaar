"use strict";

const db = require("../config/db");
const fs = require("fs");
const path = require("path");

/* ================= UPLOAD RESUME ================= */
exports.uploadResume = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const fileName = req.file.filename;
    const resumePath = `uploads/resumes/${fileName}`;
    const fileSize = req.file.size;

    const [rows] = await db.query(
      "SELECT id FROM wk_resumes WHERE user_id = ?",
      [userId]
    );

    if (rows.length > 0) {
      await db.query(
        `UPDATE wk_resumes
         SET file_name = ?, file_path = ?, file_size = ?
         WHERE user_id = ?`,
        [fileName, resumePath, fileSize, userId]
      );
    } else {
      await db.query(
        `INSERT INTO wk_resumes
         (user_id, file_name, file_path, file_size)
         VALUES (?, ?, ?, ?)`,
        [userId, fileName, resumePath, fileSize]
      );
    }

    return res.json({
      success: true,
      resume: {
        name: fileName,
        url: `/${resumePath}`
      }
    });

  } catch (error) {
    console.error("Resume upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload resume"
    });
  }
};

/* ================= GET RESUME ================= */
exports.getMyResume = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT file_name, file_path
       FROM wk_resumes
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (!rows.length) {
      return res.json({
        success: true,
        resume: null
      });
    }

    return res.json({
      success: true,
      resume: {
        name: rows[0].file_name,
        url: `/${rows[0].file_path}`
      }
    });

  } catch (error) {
    console.error("Get resume error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch resume"
    });
  }
};

/* ================= DELETE RESUME ================= */
exports.deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.query(
      `SELECT file_path FROM wk_resumes WHERE user_id = ?`,
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    const fullPath = path.join(__dirname, "..", rows[0].file_path);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    await db.query(
      `DELETE FROM wk_resumes WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: "Resume deleted successfully"
    });

  } catch (error) {
    console.error("Delete resume error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete resume"
    });
  }
};
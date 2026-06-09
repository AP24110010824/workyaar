"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const resumeController = require("../controllers/resume.controller");

/* ================= UPLOAD CONFIG ================= */

const uploadDir = path.join(__dirname, "../uploads/resumes");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const name =
      "resume_" + Date.now() + path.extname(file.originalname);
    cb(null, name);
  }
});

const upload = multer({ storage });

/* ================= ROUTES ================= */

router.post(
  "/",
  auth,
  requireRole(3),
  upload.single("resume"),
  resumeController.uploadResume
);

router.get(
  "/",
  auth,
  requireRole(3),
  resumeController.getMyResume
);

router.delete(
  "/",
  auth,
  requireRole(1),
  resumeController.deleteResume
);

module.exports = router;
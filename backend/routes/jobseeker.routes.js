"use strict";

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const jobseekerController = require("../controllers/jobseeker.controller");

/* ================= MULTER CONFIG ================= */

const uploadDir = path.join(__dirname, "../uploads/resumes");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName =
      "resume_" +
      req.user.id +
      "_" +
      Date.now() +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowed.test(ext)) {
      return cb(new Error("Only PDF, DOC, DOCX allowed"));
    }

    cb(null, true);
  },
}).single("resume");

/* ================= ROUTES ================= */

router.get("/profile", auth, requireRole(3), jobseekerController.getProfile);
router.put("/profile", auth, requireRole(3), jobseekerController.updateProfile);

router.get("/preferences", auth, jobseekerController.getPreferences);
router.put("/preferences", auth, requireRole(3), jobseekerController.savePreferences);

router.get("/resume", auth, requireRole(3), jobseekerController.getResume);

router.post(
  "/resume",
  auth,
  requireRole(3),
  upload,
  jobseekerController.uploadResume
);

/*router.post("/resume", auth, requireRole(3), (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    try {
      const resumePath = `uploads/resumes/${req.file.filename}`;
      await jobseekerController.uploadResumeToDB(req.user.id, resumePath);

      res.json({ success: true, resume_path: resumePath });
    } catch (error) {
      res.status(500).json({ success: false });
    }
  });
});*/

router.get("/skills", auth, requireRole(3), jobseekerController.getSkills);
router.post("/skills", auth, requireRole(3), jobseekerController.addSkill);
router.delete("/skills/:id", auth, requireRole(3), jobseekerController.deleteSkill);

router.get("/experience", auth, requireRole(3), jobseekerController.getExperience);
router.post("/experience", auth, requireRole(3), jobseekerController.addExperience);
router.delete("/experience/:id", auth, requireRole(3), jobseekerController.deleteExperience);

router.post("/apply", auth, requireRole(3), jobseekerController.applyJob);
router.get("/applied-jobs", auth, requireRole(3), jobseekerController.getAppliedJobs);

module.exports = router;

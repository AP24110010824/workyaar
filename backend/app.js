"use strict";

/**
 * =====================================================
 * WORKYAAR – MAIN SERVER FILE (app.js)
 * =====================================================
 */

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const rateLimit = require("express-rate-limit");
const path    = require("path");

const app = express();
const frontendPath = path.join(__dirname, "..", "frontend", "public");

const industryRoutes = require("./routes/industryRoutes");
const locationRoutes = require("./routes/location.routes");

/* =====================================================
   TRUST PROXY
===================================================== */
app.set("trust proxy", 1);

/* =====================================================
   SECURITY (HELMET) — CSP allows inline scripts
   needed by login.html, register.html, dashboards
===================================================== */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc:    ["'self'"],
        scriptSrc:     ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc:      ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc:       ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc:        ["'self'", "data:", "blob:"],
        connectSrc:    ["'self'", "https://workyaar.com", "http://localhost:5000", "http://localhost:5002"]
      }
    }
  })
);

/* =====================================================
   LOGGER
===================================================== */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

/* =====================================================
   RATE LIMIT
===================================================== */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many login attempts. Try later."
});

app.use(generalLimiter);

/* =====================================================
   CORS
===================================================== */
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());

/* =====================================================
   BODY PARSER
===================================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   STATIC FILES
===================================================== */
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(frontendPath));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =====================================================
   AUTH MIDDLEWARE
===================================================== */
const authMiddleware = require("./middlewares/auth");

/* =====================================================
   API ROUTES
===================================================== */

// Auth (Public)
app.use("/api/auth", authLimiter, require("./routes/auth.routes"));

// Jobs (Mixed: Public + Protected handled inside routes)
app.use("/api/jobs", require("./routes/job.routes"));

// Protected Routes
app.use("/api/jobseeker",    authMiddleware, require("./routes/jobseeker.routes"));
app.use("/api/employer",     authMiddleware, require("./routes/employer.routes"));
app.use("/api/resume",       authMiddleware, require("./routes/resume.routes"));
app.use("/api/messages",     authMiddleware, require("./routes/message.routes"));
app.use("/api/applications", authMiddleware, require("./routes/application.routes"));
app.use("/api/interviews",   authMiddleware, require("./routes/interview.routes"));
app.use("/api/admin",        authMiddleware, require("./routes/admin.routes"));

// Public
app.use("/api/industries", industryRoutes);
app.use("/api/locations",  locationRoutes);
app.use("/api/categories", require("./routes/category.routes"));

/* =====================================================
   HEALTH CHECK
===================================================== */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "WorkYaar API",
    time: new Date()
  });
});

/* =====================================================
   404 HANDLER
===================================================== */
app.use((req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(404).json({
      success: false,
      message: "API route not found"
    });
  }

  res.sendFile(path.join(frontendPath, "index.html"));
});

/* =====================================================
   ERROR HANDLER
===================================================== */
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Server error"
  });
});

/* =====================================================
   START SERVER
===================================================== */
const PORT = 5002;

app.listen(PORT, () => {
  console.log(`✅ WorkYaar API running on port ${PORT}`);
});

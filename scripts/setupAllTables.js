"use strict";
require("dotenv").config({ path: "./config/.env" });
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: false,
  });

  console.log("✅ Connected to:", process.env.DB_NAME);

  const run = async (sql, label) => {
    try {
      await conn.query(sql);
      console.log(`✅ ${label}`);
    } catch (e) {
      console.error(`❌ ${label}:`, e.message);
    }
  };

  // ─── 1. ROLES ───────────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_user_roles (
    id   INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_user_roles");

  await run(`INSERT IGNORE INTO wk_user_roles (id,name) VALUES (1,'admin'),(2,'employer'),(3,'jobseeker'),(4,'moderator')`, "roles seed");

  // ─── 2. ACCOUNT STATUSES ────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_account_statuses (
    id   INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_account_statuses");

  await run(`INSERT IGNORE INTO wk_account_statuses (id,name) VALUES (1,'active'),(2,'suspended'),(3,'pending')`, "statuses seed");

  // ─── 3. USERS ───────────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_users (
    id                   INT PRIMARY KEY AUTO_INCREMENT,
    role_id              INT NOT NULL,
    first_name           VARCHAR(100),
    last_name            VARCHAR(100),
    full_name            VARCHAR(200),
    email                VARCHAR(255) NOT NULL UNIQUE,
    password_hash        VARCHAR(255) NOT NULL,
    category_type        VARCHAR(100) DEFAULT NULL,
    job_type_id          INT DEFAULT NULL,
    referral_code        VARCHAR(100) DEFAULT NULL,
    source               VARCHAR(100) DEFAULT NULL,
    account_status_id    INT DEFAULT 1,
    is_verified          TINYINT(1) DEFAULT 1,
    verification_token   VARCHAR(255) DEFAULT NULL,
    verification_expires DATETIME DEFAULT NULL,
    reset_token          VARCHAR(255) DEFAULT NULL,
    reset_expires        DATETIME DEFAULT NULL,
    last_login_at        DATETIME DEFAULT NULL,
    created_at           DATETIME DEFAULT NOW(),
    updated_at           DATETIME DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (role_id) REFERENCES wk_user_roles(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_users");

  // ─── 4. JWT TOKENS ──────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_jwt_tokens (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    revoked    TINYINT(1) DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_jwt_tokens");

  // Add revoked column if it doesn't exist
  await run(`ALTER TABLE wk_jwt_tokens ADD COLUMN IF NOT EXISTS revoked TINYINT(1) DEFAULT 0`, "wk_jwt_tokens.revoked column");

  // ─── 5. LOGIN HISTORY ───────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_login_history (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_login_history");

  // ─── 6. USER PROFILES ───────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_user_profiles (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL UNIQUE,
    phone      VARCHAR(30),
    city       VARCHAR(150),
    state      VARCHAR(150),
    country    VARCHAR(100) DEFAULT 'India',
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_user_profiles");

  // ─── 7. JOBSEEKERS ──────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_jobseekers (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL UNIQUE,
    career     TEXT,
    summary    TEXT,
    created_at DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_jobseekers");

  // ─── 8. COMPANIES ───────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_companies (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    created_by   INT,
    created_at   DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_companies");

  // ─── 9. COMPANY PROFILES ────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_company_profiles (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    company_id     INT NOT NULL UNIQUE,
    company_name   VARCHAR(255),
    about          TEXT,
    description    TEXT,
    website        VARCHAR(500),
    linkedin       VARCHAR(500),
    phone          VARCHAR(50),
    email          VARCHAR(255),
    logo           VARCHAR(500),
    employer_type  VARCHAR(50),
    industry       VARCHAR(100),
    company_size   VARCHAR(50),
    location       VARCHAR(255),
    office_address TEXT,
    country        VARCHAR(100),
    state          VARCHAR(100),
    city           VARCHAR(100),
    founded_year   VARCHAR(10),
    hiring_status  VARCHAR(50) DEFAULT 'active',
    pwd_hiring     VARCHAR(10),
    ngo_type       VARCHAR(10),
    gst            VARCHAR(50),
    created_at     DATETIME DEFAULT NOW(),
    FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_company_profiles");

  // ─── 10. COMPANY USERS ──────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_company_users (
    id         INT PRIMARY KEY AUTO_INCREMENT,
    user_id    INT NOT NULL,
    company_id INT NOT NULL,
    role       VARCHAR(50) DEFAULT 'admin',
    joined_at  DATETIME DEFAULT NOW(),
    UNIQUE KEY uq_user_company (user_id, company_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_company_users");

  // ─── 11. ADMIN USERS ────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_admin_users (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    user_id       INT NOT NULL UNIQUE,
    admin_role_id INT DEFAULT 1,
    created_at    DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_admin_users");

  // ─── 12. JOB CATEGORIES ─────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_job_categories (
    id   INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_job_categories");

  await run(`INSERT IGNORE INTO wk_job_categories (name) VALUES
    ('Technology'),('Finance'),('Healthcare'),('Education'),
    ('Marketing'),('Design'),('Sales'),('Operations'),
    ('HR'),('Legal'),('Engineering'),('Manufacturing'),
    ('Software Development'),('Data Science'),('Testing')`, "job_categories seed");

  // ─── 13. JOB TYPES ──────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_job_types (
    id   INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_job_types");

  await run(`INSERT IGNORE INTO wk_job_types (name) VALUES
    ('Full-time'),('Part-time'),('Freelance'),('Contract'),('Internship'),('Remote')`, "job_types seed");

  // ─── 14. INDUSTRIES ─────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_industries (
    id   INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL UNIQUE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_industries");

  await run(`INSERT IGNORE INTO wk_industries (name) VALUES
    ('Information Technology'),('Banking & Finance'),('Healthcare'),
    ('E-Commerce'),('Manufacturing'),('Education'),('Consulting'),
    ('Media & Entertainment'),('Real Estate'),('Retail')`, "industries seed");

  // ─── 15. JOBS ───────────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_jobs (
    id               INT PRIMARY KEY AUTO_INCREMENT,
    company_id       INT NOT NULL,
    category_id      INT,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    location         VARCHAR(255),
    salary_min       DECIMAL(12,2),
    salary_max       DECIMAL(12,2),
    job_type         VARCHAR(50) DEFAULT 'Full-time',
    experience_level VARCHAR(100),
    is_active        TINYINT(1) DEFAULT 1,
    created_at       DATETIME DEFAULT NOW(),
    updated_at       DATETIME DEFAULT NOW() ON UPDATE NOW()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_jobs");

  // ─── 16. JOB APPLICATIONS ───────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_job_applications (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    job_id       INT NOT NULL,
    user_id      INT,
    jobseeker_id INT,
    status       VARCHAR(50) DEFAULT 'applied',
    applied_at   DATETIME DEFAULT NOW(),
    updated_at   DATETIME DEFAULT NOW() ON UPDATE NOW()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_job_applications");

  // ─── 17. RESUMES ────────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_resumes (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    user_id     INT NOT NULL,
    file_name   VARCHAR(255),
    file_path   VARCHAR(500),
    file_size   INT,
    created_at  DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_resumes");

  // ─── 18. JOBSEEKER SKILLS ───────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_jobseeker_skills (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    jobseeker_id INT NOT NULL,
    skill_name   VARCHAR(100) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_jobseeker_skills");

  // ─── 19. JOBSEEKER EXPERIENCE ───────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_jobseeker_experience (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    jobseeker_id INT NOT NULL,
    company      VARCHAR(200),
    role         VARCHAR(200),
    years        VARCHAR(50)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_jobseeker_experience");

  // ─── 20. SAVED JOBS ─────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_saved_jobs (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    job_id       INT NOT NULL,
    jobseeker_id INT NOT NULL,
    saved_at     DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_saved_jobs");

  // ─── 21. USER JOB PREFERENCES ───────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_user_job_preferences (
    id                 INT PRIMARY KEY AUTO_INCREMENT,
    user_id            INT NOT NULL UNIQUE,
    job_type           VARCHAR(50),
    job_type_id        INT,
    work_mode          VARCHAR(50),
    preferred_location VARCHAR(255),
    expected_salary    VARCHAR(100),
    industry           VARCHAR(100),
    notice_period      VARCHAR(50)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_user_job_preferences");

  // ─── 22. MESSAGES ───────────────────────────────────────
  await run(`CREATE TABLE IF NOT EXISTS wk_messages (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    sender_id   INT NOT NULL,
    receiver_id INT NOT NULL,
    content     TEXT NOT NULL,
    is_read     TINYINT(1) DEFAULT 0,
    sent_at     DATETIME DEFAULT NOW()
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, "wk_messages");

  // ─────────────────────────────────────────────────────────
  // SEED TEST ACCOUNTS
  // ─────────────────────────────────────────────────────────
  console.log("\n🌱 Seeding test accounts...");

  const accounts = [
    { email: "employer@test.com", password: "EmployerPass123!", role_id: 2, full_name: "Test Employer" },
    { email: "seeker@test.com",   password: "SeekerPass123!",   role_id: 3, full_name: "Test Seeker" },
  ];

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const names = acc.full_name.split(" ");
    const first_name = names[0];
    const last_name  = names.slice(1).join(" ") || null;

    try {
      await conn.query("DELETE FROM wk_users WHERE email = ?", [acc.email]);
      const [result] = await conn.query(
        `INSERT INTO wk_users
          (role_id, first_name, last_name, full_name, email, password_hash,
           source, account_status_id, is_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'web', 1, 1, NOW())`,
        [acc.role_id, first_name, last_name, acc.full_name, acc.email, hash]
      );
      const userId = result.insertId;
      console.log(`✅ User: ${acc.email} (id=${userId}, role=${acc.role_id})`);

      // Employer extra tables
      if (acc.role_id === 2) {
        const [compRes] = await conn.query(
          "INSERT INTO wk_companies (company_name, created_by) VALUES (?, ?)",
          [`${acc.full_name}'s Company`, userId]
        );
        const companyId = compRes.insertId;
        await conn.query(
          "INSERT IGNORE INTO wk_company_users (user_id, company_id, role) VALUES (?, ?, 'admin')",
          [userId, companyId]
        );
        await conn.query(
          "INSERT IGNORE INTO wk_company_profiles (company_id, company_name) VALUES (?, ?)",
          [companyId, `${acc.full_name}'s Company`]
        );
        console.log(`   ↳ Company profile created (company_id=${companyId})`);
      }

      // Jobseeker extra tables
      if (acc.role_id === 3) {
        await conn.query(
          "INSERT IGNORE INTO wk_jobseekers (user_id) VALUES (?)", [userId]
        );
        await conn.query(
          "INSERT IGNORE INTO wk_user_profiles (user_id) VALUES (?)", [userId]
        );
        console.log(`   ↳ Jobseeker profile created`);
      }
    } catch (e) {
      console.error(`❌ Seed error for ${acc.email}:`, e.message);
    }
  }

  await conn.end();

  console.log("\n🎉 All tables created & seeded!");
  console.log("────────────────────────────────────────────────");
  console.log("Employer → employer@test.com / EmployerPass123!");
  console.log("Seeker   → seeker@test.com   / SeekerPass123!");
  console.log("Server   → http://localhost:5002");
  console.log("────────────────────────────────────────────────");
})().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});

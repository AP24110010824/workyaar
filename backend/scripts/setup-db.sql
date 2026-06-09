-- ================================================================
-- WORKYAAR DATABASE SETUP SCRIPT
-- Run this in MySQL Workbench or via MySQL CLI
-- ================================================================

CREATE DATABASE IF NOT EXISTS workradt_workyaar_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE workradt_workyaar_db;

-- Create user if not exists and grant permissions
CREATE USER IF NOT EXISTS 'workradt_workyaar_user'@'localhost'
  IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON workradt_workyaar_db.* 
  TO 'workradt_workyaar_user'@'localhost';
FLUSH PRIVILEGES;

-- ================================================================
-- 1. ROLES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_user_roles (
  id   INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO wk_user_roles (id, name) VALUES
  (1, 'admin'),
  (2, 'employer'),
  (3, 'jobseeker'),
  (4, 'moderator');

-- ================================================================
-- 2. ACCOUNT STATUSES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_account_statuses (
  id   INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT IGNORE INTO wk_account_statuses (id, name) VALUES
  (1, 'active'),
  (2, 'suspended'),
  (3, 'pending');

-- ================================================================
-- 3. USERS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_users (
  id                   INT PRIMARY KEY AUTO_INCREMENT,
  role_id              INT NOT NULL,
  first_name           VARCHAR(100),
  last_name            VARCHAR(100),
  full_name            VARCHAR(200),
  email                VARCHAR(255) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  category_type        ENUM('IT','NON_IT','LABOUR','SERVICES') DEFAULT 'IT',
  job_type_id          INT DEFAULT NULL,
  referral_code        VARCHAR(100) DEFAULT NULL,
  source               VARCHAR(100) DEFAULT NULL,
  account_status_id    INT DEFAULT 1,
  is_verified          TINYINT(1) DEFAULT 0,
  verification_token   VARCHAR(255) DEFAULT NULL,
  verification_expires DATETIME DEFAULT NULL,
  reset_token          VARCHAR(255) DEFAULT NULL,
  reset_expires        DATETIME DEFAULT NULL,
  last_login_at        DATETIME DEFAULT NULL,
  created_at           DATETIME DEFAULT NOW(),
  updated_at           DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (role_id) REFERENCES wk_user_roles(id),
  FOREIGN KEY (account_status_id) REFERENCES wk_account_statuses(id)
);

-- ================================================================
-- 4. JWT TOKENS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_jwt_tokens (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  revoked    TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

-- ================================================================
-- 5. LOGIN HISTORY
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_login_history (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  logged_at  DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

-- ================================================================
-- 6. JOBSEEKERS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_jobseekers (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT NOT NULL UNIQUE,
  full_name     VARCHAR(200),
  email         VARCHAR(255),
  mobile        VARCHAR(30),
  location      VARCHAR(255),
  skills        TEXT,
  experience    TEXT,
  career        TEXT,
  certifications TEXT,
  education     TEXT,
  summary       TEXT,
  description   TEXT,
  profile_photo VARCHAR(500),
  resume_path   VARCHAR(500),
  created_at    DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

-- ================================================================
-- 7. COMPANIES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_companies (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(255) NOT NULL,
  created_by   INT,
  created_at   DATETIME DEFAULT NOW(),
  FOREIGN KEY (created_by) REFERENCES wk_users(id)
);

-- ================================================================
-- 8. COMPANY PROFILES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_company_profiles (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  company_id      INT NOT NULL UNIQUE,
  company_name    VARCHAR(255),
  description     TEXT,
  website         VARCHAR(500),
  logo_path       VARCHAR(500),
  industry        VARCHAR(100),
  size            VARCHAR(50),
  location        VARCHAR(255),
  created_at      DATETIME DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE
);

-- ================================================================
-- 9. COMPANY USERS (Employer ↔ Company)
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_company_users (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  company_id INT NOT NULL,
  role       VARCHAR(50) DEFAULT 'member',
  joined_at  DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_company (user_id, company_id)
);

-- ================================================================
-- 10. ADMIN USERS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_admin_users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  user_id       INT NOT NULL UNIQUE,
  admin_role_id INT DEFAULT 1,
  created_at    DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

-- ================================================================
-- 11. CATEGORIES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_categories (
  id   INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE
);

INSERT IGNORE INTO wk_categories (name) VALUES
  ('Technology'), ('Finance'), ('Healthcare'), ('Education'),
  ('Marketing'), ('Design'), ('Sales'), ('Operations'),
  ('HR'), ('Legal'), ('Engineering'), ('Manufacturing');

-- ================================================================
-- 12. INDUSTRIES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_industries (
  id   INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL UNIQUE
);

INSERT IGNORE INTO wk_industries (name) VALUES
  ('Information Technology'), ('Banking & Finance'), ('Healthcare'),
  ('E-Commerce'), ('Manufacturing'), ('Education'), ('Consulting'),
  ('Media & Entertainment'), ('Real Estate'), ('Retail');

-- ================================================================
-- 13. LOCATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_locations (
  id      INT PRIMARY KEY AUTO_INCREMENT,
  city    VARCHAR(150) NOT NULL,
  state   VARCHAR(150),
  country VARCHAR(100) DEFAULT 'India'
);

INSERT IGNORE INTO wk_locations (city, state) VALUES
  ('Bangalore', 'Karnataka'), ('Mumbai', 'Maharashtra'),
  ('Delhi', 'Delhi'), ('Hyderabad', 'Telangana'),
  ('Chennai', 'Tamil Nadu'), ('Pune', 'Maharashtra'),
  ('Kolkata', 'West Bengal'), ('Ahmedabad', 'Gujarat'),
  ('Remote', NULL);

-- ================================================================
-- 14. JOBS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_jobs (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  company_id   INT NOT NULL,
  posted_by    INT NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  requirements TEXT,
  salary_min   DECIMAL(12,2),
  salary_max   DECIMAL(12,2),
  location     VARCHAR(255),
  job_type     ENUM('full_time','part_time','freelance','internship','contract') DEFAULT 'full_time',
  category_id  INT,
  industry_id  INT,
  status       ENUM('active','closed','draft') DEFAULT 'active',
  created_at   DATETIME DEFAULT NOW(),
  updated_at   DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (company_id) REFERENCES wk_companies(id),
  FOREIGN KEY (posted_by) REFERENCES wk_users(id),
  FOREIGN KEY (category_id) REFERENCES wk_categories(id),
  FOREIGN KEY (industry_id) REFERENCES wk_industries(id)
);

-- ================================================================
-- 15. APPLICATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_applications (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  job_id       INT NOT NULL,
  applicant_id INT NOT NULL,
  status       ENUM('applied','reviewed','shortlisted','rejected','hired') DEFAULT 'applied',
  cover_letter TEXT,
  applied_at   DATETIME DEFAULT NOW(),
  updated_at   DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (job_id) REFERENCES wk_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (applicant_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_application (job_id, applicant_id)
);

-- ================================================================
-- 16. RESUMES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_resumes (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  file_path   VARCHAR(500),
  uploaded_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

-- ================================================================
-- 17. INTERVIEWS
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_interviews (
  id             INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL,
  scheduled_at   DATETIME,
  mode           ENUM('online','offline','phone') DEFAULT 'online',
  notes          TEXT,
  status         ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
  created_at     DATETIME DEFAULT NOW(),
  FOREIGN KEY (application_id) REFERENCES wk_applications(id) ON DELETE CASCADE
);

-- ================================================================
-- 18. MESSAGES
-- ================================================================
CREATE TABLE IF NOT EXISTS wk_messages (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  sender_id   INT NOT NULL,
  receiver_id INT NOT NULL,
  content     TEXT NOT NULL,
  is_read     TINYINT(1) DEFAULT 0,
  sent_at     DATETIME DEFAULT NOW(),
  FOREIGN KEY (sender_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

-- ================================================================
-- DONE
-- ================================================================
SELECT 'WorkYaar database setup complete!' AS Status;

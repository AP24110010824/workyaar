-- ================================================================
-- WorkYaar MySQL schema
-- Paste this file into MySQL Workbench and run it.
-- Then set backend/.env DB_NAME=workyaar_db.
-- ================================================================

CREATE DATABASE IF NOT EXISTS workyaar_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE workyaar_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS wk_user_roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS wk_account_statuses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS wk_job_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS wk_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_id INT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  category_type ENUM('IT','NON_IT','LABOUR','SERVICES') DEFAULT 'IT',
  job_type_id INT NULL,
  referral_code VARCHAR(100),
  source VARCHAR(100),
  account_status_id INT DEFAULT 1,
  is_verified TINYINT(1) DEFAULT 0,
  verification_token VARCHAR(255),
  verification_expires DATETIME,
  reset_token VARCHAR(255),
  reset_expires DATETIME,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role_id),
  INDEX idx_users_status (account_status_id),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES wk_user_roles(id),
  CONSTRAINT fk_users_status FOREIGN KEY (account_status_id) REFERENCES wk_account_statuses(id)
);

CREATE TABLE IF NOT EXISTS wk_jwt_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  revoked TINYINT(1) DEFAULT 0,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jwt_user (user_id),
  CONSTRAINT fk_jwt_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_login_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_user (user_id),
  CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_companies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(255) NOT NULL,
  created_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_companies_created_by (created_by),
  CONSTRAINT fk_companies_creator FOREIGN KEY (created_by) REFERENCES wk_users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wk_company_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  company_id INT NOT NULL,
  role ENUM('admin','recruiter','member') DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_company (user_id, company_id),
  INDEX idx_company_users_company (company_id),
  CONSTRAINT fk_company_users_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_company_users_company FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  admin_role_id INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_company_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL UNIQUE,
  company_name VARCHAR(255),
  employer_type ENUM('company','agency','recruiter') DEFAULT 'company',
  industry VARCHAR(150),
  industry_type VARCHAR(100),
  company_size VARCHAR(80),
  size VARCHAR(80),
  founded_year VARCHAR(20),
  hiring_status VARCHAR(50) DEFAULT 'active',
  pwd_hiring VARCHAR(20),
  ngo_type VARCHAR(20),
  gst VARCHAR(80),
  description TEXT,
  about TEXT,
  website VARCHAR(500),
  linkedin VARCHAR(500),
  phone VARCHAR(50),
  email VARCHAR(255),
  logo VARCHAR(500),
  logo_path VARCHAR(500),
  location VARCHAR(255),
  office_address TEXT,
  country VARCHAR(120),
  state VARCHAR(120),
  city VARCHAR(120),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_company_profiles_company FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_employers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  company_id INT NULL,
  company_name VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_employers_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_employers_company FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wk_jobseekers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(200),
  email VARCHAR(255),
  mobile VARCHAR(30),
  location VARCHAR(255),
  skills TEXT,
  experience TEXT,
  career TEXT,
  certifications TEXT,
  education TEXT,
  summary TEXT,
  description TEXT,
  profile_photo VARCHAR(500),
  resume_path VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_jobseekers_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_user_profiles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  full_name VARCHAR(200),
  mobile VARCHAR(30),
  location VARCHAR(255),
  summary TEXT,
  linkedin VARCHAR(500),
  github VARCHAR(500),
  portfolio VARCHAR(500),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_jobseeker_skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  skill_name VARCHAR(120) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_skill_user (user_id),
  CONSTRAINT fk_skills_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_jobseeker_experience (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  company VARCHAR(200),
  role VARCHAR(200),
  years VARCHAR(80),
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_experience_user (user_id),
  CONSTRAINT fk_experience_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_resumes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  file_path VARCHAR(500),
  original_name VARCHAR(255),
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resumes_user (user_id),
  CONSTRAINT fk_resumes_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_user_job_preferences (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL UNIQUE,
  preferred_location VARCHAR(255),
  preferred_job_type VARCHAR(80),
  salary_expectation VARCHAR(120),
  remote_preference TINYINT(1) DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_preferences_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_countries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wk_states (
  id INT PRIMARY KEY AUTO_INCREMENT,
  country_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  INDEX idx_states_country (country_id),
  CONSTRAINT fk_states_country FOREIGN KEY (country_id) REFERENCES wk_countries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_cities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  state_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  INDEX idx_cities_state (state_id),
  CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES wk_states(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_industries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(100) DEFAULT 'tech',
  name VARCHAR(150),
  industry_name VARCHAR(150),
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wk_job_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS wk_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  posted_by INT NULL,
  category_id INT NULL,
  country_id INT NULL,
  state_id INT NULL,
  city_id INT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  location VARCHAR(255),
  salary_min DECIMAL(12,2),
  salary_max DECIMAL(12,2),
  job_type VARCHAR(80) DEFAULT 'Full-time',
  experience_level VARCHAR(120),
  is_active TINYINT(1) DEFAULT 1,
  status ENUM('active','closed','draft') DEFAULT 'active',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jobs_company (company_id),
  INDEX idx_jobs_category (category_id),
  INDEX idx_jobs_active (is_active),
  CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_posted_by FOREIGN KEY (posted_by) REFERENCES wk_users(id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_category FOREIGN KEY (category_id) REFERENCES wk_job_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_country FOREIGN KEY (country_id) REFERENCES wk_countries(id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_state FOREIGN KEY (state_id) REFERENCES wk_states(id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_city FOREIGN KEY (city_id) REFERENCES wk_cities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wk_job_applications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  job_id INT NOT NULL,
  user_id INT NULL,
  jobseeker_id INT NULL,
  status ENUM('applied','reviewed','shortlisted','processed','rejected','hired') DEFAULT 'applied',
  cover_letter TEXT,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_job_user_application (job_id, user_id),
  INDEX idx_app_job (job_id),
  INDEX idx_app_user (user_id),
  INDEX idx_app_jobseeker (jobseeker_id),
  CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES wk_jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_app_jobseeker FOREIGN KEY (jobseeker_id) REFERENCES wk_jobseekers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wk_saved_jobs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved_job (user_id, job_id),
  CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_job FOREIGN KEY (job_id) REFERENCES wk_jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES wk_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES wk_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_interviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT NOT NULL,
  scheduled_at DATETIME,
  mode VARCHAR(80) DEFAULT 'online',
  notes TEXT,
  status VARCHAR(80) DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_interviews_application FOREIGN KEY (application_id) REFERENCES wk_job_applications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wk_company_invites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  role ENUM('admin','recruiter','member') DEFAULT 'member',
  token VARCHAR(255) NOT NULL UNIQUE,
  accepted TINYINT(1) DEFAULT 0,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invites_company FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

INSERT IGNORE INTO wk_user_roles (id, name) VALUES
  (1, 'admin'),
  (2, 'employer'),
  (3, 'jobseeker'),
  (4, 'moderator');

INSERT IGNORE INTO wk_account_statuses (id, name) VALUES
  (1, 'active'),
  (2, 'suspended'),
  (3, 'pending');

INSERT IGNORE INTO wk_job_types (id, name) VALUES
  (1, 'Full-time'),
  (2, 'Part-time'),
  (3, 'Contract'),
  (4, 'Remote'),
  (5, 'Freelance');

INSERT IGNORE INTO wk_job_categories (id, name) VALUES
  (1, 'Software Development'),
  (2, 'Data Science'),
  (3, 'Design'),
  (4, 'Marketing'),
  (5, 'Product'),
  (6, 'Operations');

INSERT IGNORE INTO wk_countries (id, name, is_active) VALUES
  (1, 'United States', 1),
  (2, 'India', 1);

INSERT IGNORE INTO wk_states (id, country_id, name, is_active) VALUES
  (1, 1, 'California', 1),
  (2, 1, 'New York', 1),
  (3, 2, 'Telangana', 1),
  (4, 2, 'Karnataka', 1);

INSERT IGNORE INTO wk_cities (id, state_id, name, is_active) VALUES
  (1, 1, 'San Francisco', 1),
  (2, 2, 'New York', 1),
  (3, 3, 'Hyderabad', 1),
  (4, 4, 'Bangalore', 1);

INSERT IGNORE INTO wk_industries (id, type, name, industry_name, is_active) VALUES
  (1, 'tech', 'Software', 'Software', 1),
  (2, 'tech', 'AI / ML', 'AI / ML', 1),
  (3, 'creative', 'Design', 'Design', 1),
  (4, 'business', 'Consulting', 'Consulting', 1);

SELECT 'WorkYaar schema created successfully' AS status;

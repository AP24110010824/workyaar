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
    multipleStatements: true,
  });

  console.log("Connected to database:", process.env.DB_NAME);

  // Disable FK checks to drop tables easily
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");

  const tablesToDrop = [
    "wk_saved_jobs",
    "wk_job_applications",
    "wk_jobs",
    "wk_jobseeker_experience",
    "wk_jobseeker_skills",
    "wk_jobseekers",
    "wk_user_profiles",
    "wk_user_job_preferences",
    "wk_company_profiles",
    "wk_company_users",
    "wk_companies",
    "wk_jwt_tokens",
    "wk_login_history",
    "wk_admin_users",
    "wk_users",
    "wk_user_roles",
    "wk_account_statuses",
    "wk_job_categories",
    "wk_job_types",
    "wk_industries",
    "wk_messages",
    "wk_resumes",
    "wk_countries",
    "wk_states",
    "wk_cities"
  ];

  for (const table of tablesToDrop) {
    try {
      await conn.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`Dropped table: ${table}`);
    } catch (e) {
      console.error(`Error dropping ${table}:`, e.message);
    }
  }

  // Enable FK checks again
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");

  console.log("\nRecreating tables...");

  // 1. Roles
  await conn.query(`
    CREATE TABLE wk_user_roles (
      id   INT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT INTO wk_user_roles (id, name) VALUES 
    (1, 'admin'), (2, 'employer'), (3, 'jobseeker'), (4, 'moderator')
  `);

  // 2. Account Statuses
  await conn.query(`
    CREATE TABLE wk_account_statuses (
      id   INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT INTO wk_account_statuses (id, name) VALUES 
    (1, 'active'), (2, 'suspended'), (3, 'pending')
  `);

  // 3. Users
  await conn.query(`
    CREATE TABLE wk_users (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 4. JWT Tokens
  await conn.query(`
    CREATE TABLE wk_jwt_tokens (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      user_id    INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL UNIQUE,
      revoked    TINYINT(1) DEFAULT 0,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 5. Login History
  await conn.query(`
    CREATE TABLE wk_login_history (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      user_id    INT NOT NULL,
      ip_address VARCHAR(100),
      user_agent TEXT,
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 6. User Profiles
  await conn.query(`
    CREATE TABLE wk_user_profiles (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      user_id    INT NOT NULL UNIQUE,
      phone      VARCHAR(30),
      city       VARCHAR(150),
      state      VARCHAR(150),
      country    VARCHAR(100) DEFAULT 'India',
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 7. Jobseekers
  await conn.query(`
    CREATE TABLE wk_jobseekers (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      user_id    INT NOT NULL UNIQUE,
      career     TEXT,
      summary    TEXT,
      created_at DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 8. Companies
  await conn.query(`
    CREATE TABLE wk_companies (
      id           INT PRIMARY KEY AUTO_INCREMENT,
      company_name VARCHAR(255) NOT NULL,
      created_by   INT,
      created_at   DATETIME DEFAULT NOW()
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 9. Company Profiles
  await conn.query(`
    CREATE TABLE wk_company_profiles (
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
      logo_path      VARCHAR(500),
      employer_type  VARCHAR(50),
      industry       VARCHAR(100),
      company_size   VARCHAR(50),
      size           VARCHAR(50),
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 10. Company Users
  await conn.query(`
    CREATE TABLE wk_company_users (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      user_id    INT NOT NULL,
      company_id INT NOT NULL,
      role       VARCHAR(50) DEFAULT 'admin',
      joined_at  DATETIME DEFAULT NOW(),
      UNIQUE KEY uq_user_company (user_id, company_id),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 11. Admin Users
  await conn.query(`
    CREATE TABLE wk_admin_users (
      id            INT PRIMARY KEY AUTO_INCREMENT,
      user_id       INT NOT NULL UNIQUE,
      admin_role_id INT DEFAULT 1,
      created_at    DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 12. Job Categories (Adding status and sort_order)
  await conn.query(`
    CREATE TABLE wk_job_categories (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      name       VARCHAR(100) NOT NULL UNIQUE,
      status     TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT INTO wk_job_categories (name, status, sort_order) VALUES
    ('Technology', 1, 1),
    ('Finance', 1, 2),
    ('Healthcare', 1, 3),
    ('Education', 1, 4),
    ('Marketing', 1, 5),
    ('Design', 1, 6),
    ('Sales', 1, 7),
    ('Operations', 1, 8),
    ('HR', 1, 9),
    ('Legal', 1, 10)
  `);

  // 13. Job Types
  await conn.query(`
    CREATE TABLE wk_job_types (
      id   INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT INTO wk_job_types (name) VALUES
    ('Full-time'), ('Part-time'), ('Freelance'), ('Contract'), ('Internship'), ('Remote')
  `);

  // 14. Industries
  await conn.query(`
    CREATE TABLE wk_industries (
      id   INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(150) NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 15. Countries, States, Cities
  await conn.query(`
    CREATE TABLE wk_countries (
      id        INT PRIMARY KEY AUTO_INCREMENT,
      name      VARCHAR(150) NOT NULL UNIQUE,
      is_active TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT INTO wk_countries (name, is_active) VALUES ('India', 1), ('United States', 1)
  `);

  await conn.query(`
    CREATE TABLE wk_states (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      name       VARCHAR(150) NOT NULL,
      country_id INT NOT NULL,
      is_active  TINYINT(1) DEFAULT 1,
      FOREIGN KEY (country_id) REFERENCES wk_countries(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT INTO wk_states (name, country_id, is_active) VALUES ('Delhi', 1, 1), ('California', 2, 1)
  `);

  await conn.query(`
    CREATE TABLE wk_cities (
      id        INT PRIMARY KEY AUTO_INCREMENT,
      name      VARCHAR(150) NOT NULL,
      state_id  INT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      FOREIGN KEY (state_id) REFERENCES wk_states(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await conn.query(`
    INSERT INTO wk_cities (name, state_id, is_active) VALUES ('New Delhi', 1, 1), ('Los Angeles', 2, 1)
  `);

  // 16. Jobs (Adding country_id, state_id, city_id)
  await conn.query(`
    CREATE TABLE wk_jobs (
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
      country_id       INT,
      state_id         INT,
      city_id          INT,
      applied_at       DATETIME DEFAULT NOW(),
      created_at       DATETIME DEFAULT NOW(),
      updated_at       DATETIME DEFAULT NOW() ON UPDATE NOW(),
      FOREIGN KEY (company_id) REFERENCES wk_companies(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES wk_job_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (country_id) REFERENCES wk_countries(id) ON DELETE SET NULL,
      FOREIGN KEY (state_id) REFERENCES wk_states(id) ON DELETE SET NULL,
      FOREIGN KEY (city_id) REFERENCES wk_cities(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 17. Job Applications
  await conn.query(`
    CREATE TABLE wk_job_applications (
      id           INT PRIMARY KEY AUTO_INCREMENT,
      job_id       INT NOT NULL,
      user_id      INT,
      jobseeker_id INT,
      status       VARCHAR(50) DEFAULT 'applied',
      applied_at   DATETIME DEFAULT NOW(),
      updated_at   DATETIME DEFAULT NOW() ON UPDATE NOW(),
      FOREIGN KEY (job_id) REFERENCES wk_jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 18. Resumes
  await conn.query(`
    CREATE TABLE wk_resumes (
      id          INT PRIMARY KEY AUTO_INCREMENT,
      user_id     INT NOT NULL,
      file_name   VARCHAR(255),
      file_path   VARCHAR(500),
      file_size   INT,
      created_at  DATETIME DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 19. Jobseeker Skills
  await conn.query(`
    CREATE TABLE wk_jobseeker_skills (
      id           INT PRIMARY KEY AUTO_INCREMENT,
      jobseeker_id INT NOT NULL,
      skill_name   VARCHAR(100) NOT NULL,
      FOREIGN KEY (jobseeker_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 20. Jobseeker Experience
  await conn.query(`
    CREATE TABLE wk_jobseeker_experience (
      id           INT PRIMARY KEY AUTO_INCREMENT,
      jobseeker_id INT NOT NULL,
      company      VARCHAR(200),
      role         VARCHAR(200),
      years        VARCHAR(50),
      FOREIGN KEY (jobseeker_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 21. Saved Jobs
  await conn.query(`
    CREATE TABLE wk_saved_jobs (
      id           INT PRIMARY KEY AUTO_INCREMENT,
      job_id       INT NOT NULL,
      jobseeker_id INT NOT NULL,
      saved_at     DATETIME DEFAULT NOW(),
      FOREIGN KEY (job_id) REFERENCES wk_jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (jobseeker_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 22. User Job Preferences
  await conn.query(`
    CREATE TABLE wk_user_job_preferences (
      id                 INT PRIMARY KEY AUTO_INCREMENT,
      user_id            INT NOT NULL UNIQUE,
      job_type           VARCHAR(50),
      job_type_id        INT,
      work_mode          VARCHAR(50),
      preferred_location VARCHAR(255),
      expected_salary    VARCHAR(100),
      industry           VARCHAR(100),
      notice_period      VARCHAR(50),
      FOREIGN KEY (user_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // 23. Messages
  await conn.query(`
    CREATE TABLE wk_messages (
      id          INT PRIMARY KEY AUTO_INCREMENT,
      sender_id   INT NOT NULL,
      receiver_id INT NOT NULL,
      content     TEXT NOT NULL,
      is_read     TINYINT(1) DEFAULT 0,
      sent_at     DATETIME DEFAULT NOW(),
      FOREIGN KEY (sender_id) REFERENCES wk_users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES wk_users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

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
        "INSERT INTO wk_company_users (user_id, company_id, role) VALUES (?, ?, 'admin')",
        [userId, companyId]
      );
      await conn.query(
        "INSERT INTO wk_company_profiles (company_id, company_name) VALUES (?, ?)",
        [companyId, `${acc.full_name}'s Company`]
      );
      console.log(`   ↳ Company profile created (company_id=${companyId})`);
    }

    // Jobseeker extra tables
    if (acc.role_id === 3) {
      await conn.query(
        "INSERT INTO wk_jobseekers (user_id) VALUES (?)", [userId]
      );
      await conn.query(
        "INSERT INTO wk_user_profiles (user_id) VALUES (?)", [userId]
      );
      console.log(`   ↳ Jobseeker profile created`);
    }
  }

  await conn.end();
  console.log("\n🎉 Database fully recreated and seeded successfully!");
})().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});

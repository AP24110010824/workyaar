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

  console.log("✅ Connected to DB:", process.env.DB_NAME);

  // ──────────────────────────────────────────────
  // 1. CREATE TABLES (if they don't already exist)
  // ──────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_user_roles (
      id   INT PRIMARY KEY,
      name VARCHAR(50) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    INSERT IGNORE INTO wk_user_roles (id, name) VALUES
      (1, 'admin'), (2, 'employer'), (3, 'jobseeker');
  `);
  console.log("✅ wk_user_roles ready");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_users (
      id                    INT AUTO_INCREMENT PRIMARY KEY,
      role_id               INT NOT NULL,
      first_name            VARCHAR(100),
      last_name             VARCHAR(100),
      full_name             VARCHAR(200),
      email                 VARCHAR(255) NOT NULL UNIQUE,
      password_hash         VARCHAR(255) NOT NULL,
      category_type         VARCHAR(100) DEFAULT NULL,
      job_type_id           INT          DEFAULT NULL,
      referral_code         VARCHAR(50)  DEFAULT NULL,
      source                VARCHAR(50)  DEFAULT 'web',
      account_status_id     INT          DEFAULT 1,
      is_verified           TINYINT(1)   DEFAULT 1,
      verification_token    VARCHAR(255) DEFAULT NULL,
      verification_expires  DATETIME     DEFAULT NULL,
      last_login_at         DATETIME     DEFAULT NULL,
      created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES wk_user_roles(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ wk_users ready");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_companies (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      company_name VARCHAR(200) NOT NULL,
      created_by   INT,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ wk_companies ready");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_company_users (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      company_id INT NOT NULL,
      role       VARCHAR(50) DEFAULT 'admin'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ wk_company_users ready");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_company_profiles (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      company_id   INT NOT NULL,
      company_name VARCHAR(200),
      about        TEXT,
      website      VARCHAR(255),
      linkedin     VARCHAR(255),
      phone        VARCHAR(50),
      email        VARCHAR(255),
      office_address TEXT,
      country      VARCHAR(100),
      state        VARCHAR(100),
      city         VARCHAR(100),
      company_size VARCHAR(50),
      founded_year VARCHAR(10),
      hiring_status VARCHAR(50) DEFAULT 'active',
      pwd_hiring   VARCHAR(10),
      ngo_type     VARCHAR(10),
      gst          VARCHAR(50),
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ wk_company_profiles ready");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_jwt_tokens (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ wk_jwt_tokens ready");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_login_history (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      ip_address VARCHAR(50),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ wk_login_history ready");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS wk_jobseekers (
      id      INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("✅ wk_jobseekers ready");

  // ──────────────────────────────────────────────
  // 2. SEED TEST ACCOUNTS
  // ──────────────────────────────────────────────
  const accounts = [
    { email: "employer@test.com", password: "EmployerPass123!", role_id: 2, full_name: "Test Employer" },
    { email: "seeker@test.com",   password: "SeekerPass123!",   role_id: 3, full_name: "Test Seeker" },
  ];

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    const names = acc.full_name.split(" ");
    const first_name = names[0];
    const last_name  = names.slice(1).join(" ") || null;

    // DELETE existing user with same email so we can re-seed cleanly
    await conn.query("DELETE FROM wk_users WHERE email = ?", [acc.email]);

    const [result] = await conn.query(
      `INSERT INTO wk_users
        (role_id, first_name, last_name, full_name, email, password_hash,
         source, account_status_id, is_verified, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'web', 1, 1, NOW())`,
      [acc.role_id, first_name, last_name, acc.full_name, acc.email, hash]
    );

    const userId = result.insertId;
    console.log(`✅ Inserted user: ${acc.email} (id=${userId}, role=${acc.role_id})`);

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

    // Jobseeker extra table
    if (acc.role_id === 3) {
      await conn.query(
        "INSERT IGNORE INTO wk_jobseekers (user_id) VALUES (?)",
        [userId]
      );
      console.log(`   ↳ Jobseeker profile created`);
    }
  }

  await conn.end();
  console.log("\n🎉 Seeding complete!");
  console.log("────────────────────────────────────────");
  console.log("Employer login → employer@test.com / EmployerPass123!");
  console.log("Seeker  login → seeker@test.com   / SeekerPass123!");
  console.log("────────────────────────────────────────");
})().catch((err) => {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
});

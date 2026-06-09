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
  });

  // Fix 1: Add revoked column to wk_jwt_tokens if missing
  try {
    const [cols] = await conn.query("SHOW COLUMNS FROM wk_jwt_tokens LIKE 'revoked'");
    if (cols.length === 0) {
      await conn.query("ALTER TABLE wk_jwt_tokens ADD COLUMN revoked TINYINT(1) DEFAULT 0");
      console.log("✅ Added 'revoked' column to wk_jwt_tokens");
    } else {
      console.log("✅ wk_jwt_tokens.revoked already exists");
    }
  } catch (e) {
    console.error("❌ revoked column fix:", e.message);
  }

  // Fix 2: Clean up old employer data & re-seed
  // Disable FK checks temporarily
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");

  // Delete old employer user and related data
  const [oldUsers] = await conn.query("SELECT id FROM wk_users WHERE email = 'employer@test.com'");
  for (const u of oldUsers) {
    await conn.query("DELETE FROM wk_company_profiles WHERE company_id IN (SELECT id FROM wk_companies WHERE created_by = ?)", [u.id]);
    await conn.query("DELETE FROM wk_company_users WHERE user_id = ?", [u.id]);
    await conn.query("DELETE FROM wk_companies WHERE created_by = ?", [u.id]);
    await conn.query("DELETE FROM wk_jwt_tokens WHERE user_id = ?", [u.id]);
    await conn.query("DELETE FROM wk_login_history WHERE user_id = ?", [u.id]);
    await conn.query("DELETE FROM wk_users WHERE id = ?", [u.id]);
    console.log(`✅ Cleaned old employer user id=${u.id}`);
  }

  // Re-enable FK checks
  await conn.query("SET FOREIGN_KEY_CHECKS = 1");

  // Seed employer
  const hash = await bcrypt.hash("EmployerPass123!", 10);
  const [result] = await conn.query(
    `INSERT INTO wk_users
      (role_id, first_name, last_name, full_name, email, password_hash,
       source, account_status_id, is_verified, created_at)
     VALUES (2, 'Test', 'Employer', 'Test Employer', 'employer@test.com', ?, 'web', 1, 1, NOW())`,
    [hash]
  );
  const userId = result.insertId;
  console.log(`✅ Created employer user id=${userId}`);

  const [compRes] = await conn.query(
    "INSERT INTO wk_companies (company_name, created_by) VALUES (?, ?)",
    ["Test Employer's Company", userId]
  );
  const companyId = compRes.insertId;

  await conn.query(
    "INSERT INTO wk_company_users (user_id, company_id, role) VALUES (?, ?, 'admin')",
    [userId, companyId]
  );

  await conn.query(
    "INSERT INTO wk_company_profiles (company_id, company_name) VALUES (?, ?)",
    [companyId, "Test Employer's Company"]
  );
  console.log(`✅ Company created (company_id=${companyId})`);

  // Verify login works
  const [check] = await conn.query("SELECT id, role_id, is_verified, account_status_id FROM wk_users WHERE email='employer@test.com'");
  console.log("✅ Verification:", check[0]);

  await conn.end();

  console.log("\n🎉 Fix complete!");
  console.log("────────────────────────────────────────");
  console.log("Employer → employer@test.com / EmployerPass123!");
  console.log("Seeker   → seeker@test.com   / SeekerPass123!");
  console.log("Server   → http://localhost:5002");
  console.log("────────────────────────────────────────");
})().catch(e => { console.error("❌", e.message); process.exit(1); });
